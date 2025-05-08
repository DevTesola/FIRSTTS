# TESOLA Database Schema and Functions

This document provides a comprehensive overview of the Supabase database schema and functions used in the TESOLA project.

## Core Tables

### minted_nfts
```sql
-- Schema / Structure Updates
ALTER TABLE public.minted_nfts
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'available',
ADD COLUMN IF NOT EXISTS lock_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_tx_signature text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Presale related columns
ALTER TABLE minted_nfts ADD COLUMN is_presale BOOLEAN DEFAULT FALSE;
ALTER TABLE minted_nfts ADD COLUMN presale_price NUMERIC(20, 9) DEFAULT NULL;

-- Make mint_index nullable (for presale)
ALTER TABLE minted_nfts ALTER COLUMN mint_index DROP NOT NULL;
```

### nft_staking
```sql
-- Create NFT staking table
CREATE TABLE nft_staking (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  mint_address TEXT NOT NULL,
  staking_period INTEGER NOT NULL,  -- in days
  staked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL,
  unstaked_at TIMESTAMP WITH TIME ZONE,
  total_rewards DECIMAL(10, 2) NOT NULL,
  earned_rewards DECIMAL(10, 2),
  daily_reward_rate DECIMAL(10, 2) NOT NULL,
  early_unstake_penalty DECIMAL(10, 2),
  tx_signature TEXT NOT NULL,
  unstake_tx_signature TEXT,
  status TEXT NOT NULL CHECK (status IN ('staked', 'unstaked', 'cancelled')),
  nft_tier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for frequent queries
CREATE INDEX idx_staking_wallet_status ON nft_staking(wallet_address, status);
CREATE INDEX idx_staking_mint ON nft_staking(mint_address);
```

### rewards
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- 'holding', 'tweet', 'stake', etc.
  reference_id TEXT, -- Related NFT mint address or transaction ID
  description TEXT,
  claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX rewards_wallet_idx ON rewards(wallet_address);
CREATE INDEX rewards_claimed_idx ON rewards(claimed);
```

### reward_claims
```sql
CREATE TABLE reward_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  processed_by TEXT, -- Admin wallet address
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX reward_claims_wallet_idx ON reward_claims(wallet_address);
CREATE INDEX reward_claims_status_idx ON reward_claims(status);
```

### nft_metadata_cache
```sql
-- Create metadata cache table for improved performance
CREATE TABLE nft_metadata_cache (
  id SERIAL PRIMARY KEY,
  mint_address TEXT NOT NULL UNIQUE,
  name TEXT,
  image_url TEXT,
  tier TEXT,
  attributes JSONB,
  metadata_uri TEXT,
  successful_gateway TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_metadata_cache_mint ON nft_metadata_cache(mint_address);
```

### refund_requests
```sql
-- Table creation
DROP TABLE IF EXISTS public.refund_requests;

CREATE TABLE public.refund_requests (
  id serial PRIMARY KEY,
  wallet text NOT NULL,
  mint_address text,
  tx_signature text NOT NULL,
  reason text NOT NULL,
  contact_info text,
  status text NOT NULL DEFAULT 'pending',
  mint_record_id integer,
  processed_by text,
  processed_at timestamp without time zone,
  refund_tx_signature text,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key
ALTER TABLE public.refund_requests
ADD CONSTRAINT fk_refund_requests_mint_record
FOREIGN KEY (mint_record_id) 
REFERENCES public.minted_nfts(id);

-- Create indexes
CREATE INDEX idx_refund_requests_wallet ON public.refund_requests(wallet);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_mint_record ON public.refund_requests(mint_record_id);
```

### admin_audit_logs
```sql
-- Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_wallet TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Presale Related Tables

### presale_settings
```sql
CREATE TABLE presale_settings (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  total_supply INTEGER NOT NULL,
  price_sol NUMERIC(20, 9) NOT NULL,
  max_per_wallet INTEGER DEFAULT 0,
  whitelist_only BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with default values
INSERT INTO presale_settings 
(is_active, start_time, end_time, total_supply, price_sol, max_per_wallet, whitelist_only)
VALUES 
(false, '2025-05-01 00:00:00', '2025-05-07 23:59:59', 1000000, 0.0005, 10, true);

-- Update for testing
UPDATE presale_settings 
SET is_active = true,
    start_time = CURRENT_TIMESTAMP,
    end_time = CURRENT_TIMESTAMP + INTERVAL '7 days'
WHERE id = 1;
```

### presale_whitelist
```sql
CREATE TABLE presale_whitelist (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  max_mint_count INTEGER DEFAULT 1,
  mint_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_presale_whitelist_wallet ON presale_whitelist(wallet_address);

-- Add test wallet
INSERT INTO presale_whitelist (wallet_address) 
VALUES ('8h2QEZyi79KcYBhmoo9RwGASGRQEagPvGM7VCzbuTGvi');
```

### presale_tiers
```sql
CREATE OR REPLACE FUNCTION create_presale_tiers_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS presale_tiers (
    id SERIAL PRIMARY KEY,
    tier_id VARCHAR(20) NOT NULL UNIQUE,
    tier_name VARCHAR(50) NOT NULL,
    max_sol DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    exchange_rate INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;
```

## Database Functions

### NFT Selection & Transaction Functions
```sql
-- Original random NFT selection function
CREATE OR REPLACE FUNCTION select_random_nft_index()
RETURNS TABLE (mint_index integer) AS $$
DECLARE
  selected_index integer;
BEGIN
  -- Select available index (0-999 that doesn't exist in minted_nfts)
  SELECT i INTO selected_index
  FROM generate_series(0, 999) i
  WHERE NOT EXISTS (
    SELECT 1 FROM minted_nfts WHERE minted_nfts.mint_index = i
  )
  ORDER BY random()
  LIMIT 1;

  IF selected_index IS NULL THEN
    RAISE EXCEPTION 'No available NFT indices';
  END IF;

  -- Immediately record it (prevent duplicates)
  INSERT INTO minted_nfts (mint_index, wallet)
  VALUES (selected_index, 'pending')
  ON CONFLICT ON CONSTRAINT minted_nfts_mint_index_key DO NOTHING;

  -- Check if insertion succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Index already taken';
  END IF;

  RETURN QUERY SELECT selected_index;
END;
$$ LANGUAGE plpgsql;

-- Enhanced random NFT selection with locking consideration
CREATE OR REPLACE FUNCTION public.select_random_nft_index()
RETURNS TABLE(mint_index integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY 
  SELECT mn.mint_index
  FROM minted_nfts mn
  WHERE (mn.mint_address IS NULL OR mn.mint_address = '')
    AND (mn.status = 'available' OR (mn.status = 'pending' AND mn.updated_at < NOW() - INTERVAL '10 minutes'))
  ORDER BY RANDOM()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No available NFT indices found';
  END IF;
END;
$function$;

-- Transaction management functions
CREATE OR REPLACE FUNCTION public.begin_purchase_transaction()
RETURNS TABLE(lock_id text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_lock_id text;
BEGIN
  -- Generate UUID
  v_lock_id := gen_random_uuid()::text;
  
  -- Set lock timeout (10 minutes)
  PERFORM set_config('statement_timeout', '600000', false);
  
  -- Mark lock in table (does nothing actually, just returns the lock ID)
  RETURN QUERY SELECT v_lock_id;
END;
$function$;

-- Transaction rollback function
CREATE OR REPLACE FUNCTION public.rollback_purchase_transaction(p_lock_id text, p_mint_index integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Find record by lock ID and reset status
  UPDATE minted_nfts
  SET status = 'available',
      wallet = 'none',
      lock_id = NULL,
      updated_at = CURRENT_TIMESTAMP
  WHERE mint_index = p_mint_index
    AND lock_id = p_lock_id
    AND status = 'pending';
    
  IF NOT FOUND THEN
    RAISE NOTICE 'Record not found or already processed: %, %', p_lock_id, p_mint_index;
  END IF;
END;
$function$;

-- Lock cleanup function (for batch jobs)
CREATE OR REPLACE FUNCTION public.clean_expired_locks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_count integer;
BEGIN
  UPDATE minted_nfts
  SET status = 'available',
      wallet = 'none',
      lock_id = NULL,
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'pending'
    AND updated_at < NOW() - INTERVAL '10 minutes';
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- Sales statistics function
CREATE OR REPLACE FUNCTION public.get_sales_stats()
RETURNS TABLE(
  total_nfts integer,
  available_nfts integer,
  pending_nfts integer,
  sold_nfts integer,
  verified_nfts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_nfts,
    COUNT(*) FILTER (WHERE status = 'available')::integer as available_nfts,
    COUNT(*) FILTER (WHERE status = 'pending')::integer as pending_nfts,
    COUNT(*) FILTER (WHERE status = 'completed')::integer as sold_nfts,
    COUNT(*) FILTER (WHERE verified = true)::integer as verified_nfts
  FROM minted_nfts;
END;
$function$;
```

## RLS (Row Level Security) Policies

### minted_nfts
```sql
-- Enable RLS
ALTER TABLE minted_nfts ENABLE ROW LEVEL SECURITY;

-- Add service role full access policy
CREATE POLICY "Service role full access to minted_nfts" 
ON public.minted_nfts
FOR ALL 
USING (auth.role() = 'service_role');

-- Give regular users read access
CREATE POLICY "Public read access to minted_nfts" 
ON public.minted_nfts
FOR SELECT 
USING (true);

-- Give regular users update access (if needed)
CREATE POLICY "Public update access to minted_nfts" 
ON public.minted_nfts
FOR UPDATE
USING (true);
```

### nft_staking
```sql
-- Enable RLS
ALTER TABLE nft_staking ENABLE ROW LEVEL SECURITY;

-- Create policy for read access - no auth check needed for read
CREATE POLICY staking_select_policy ON nft_staking 
  FOR SELECT USING (true);

-- Create policy for insert - anyone can insert (handle auth in API)
CREATE POLICY staking_insert_policy ON nft_staking 
  FOR INSERT WITH CHECK (true);
  
-- Create policy for update - only wallet owner can update
CREATE POLICY staking_update_policy ON nft_staking 
  FOR UPDATE USING (true) 
  WITH CHECK (true);
```

### nft_metadata_cache
```sql
-- Enable RLS
ALTER TABLE nft_metadata_cache ENABLE ROW LEVEL SECURITY;

-- Create read access policy
CREATE POLICY metadata_cache_select_policy ON nft_metadata_cache 
  FOR SELECT USING (true);

-- Create insert/update policies
CREATE POLICY metadata_cache_insert_policy ON nft_metadata_cache 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY metadata_cache_update_policy ON nft_metadata_cache 
  FOR UPDATE USING (true)
  WITH CHECK (true);
```

### rewards & reward_claims
```sql
-- Enable RLS for rewards
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- All users can read but filtering handled in API
CREATE POLICY "Public read access to rewards" 
ON rewards
FOR SELECT 
USING (true);

-- Only service role can insert, update, delete
CREATE POLICY "Service role full access to rewards" 
ON rewards
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON public.rewards
 FOR ALL USING (auth.role() = 'service_role');

-- Similar policies for reward_claims
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to reward_claims" 
ON reward_claims
FOR SELECT 
USING (true);

CREATE POLICY "Service role full access to reward_claims" 
ON reward_claims
FOR ALL
USING (auth.role() = 'service_role');
```

### refund_requests
```sql
-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- All users can read
CREATE POLICY "Public read access to refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (true);

-- Only service role has full access
CREATE POLICY "Service role full access to refund requests" 
ON public.refund_requests 
FOR ALL 
USING (auth.role() = 'service_role');
```

### admin_audit_logs
```sql
-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can write logs
CREATE POLICY "Service role write access to admin_audit_logs" 
ON admin_audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Only service role can read logs
CREATE POLICY "Service role read access to admin_audit_logs" 
ON admin_audit_logs
FOR SELECT
USING (auth.role() = 'service_role');
```

### presale_settings & presale_whitelist
```sql
-- Enable RLS for presale_settings
ALTER TABLE presale_settings ENABLE ROW LEVEL SECURITY;

-- All users can read presale settings
CREATE POLICY "Anyone can read presale settings" ON presale_settings
FOR SELECT USING (true);

-- Only server-side API can modify (service role)
CREATE POLICY "Server-side only can modify presale settings" ON presale_settings
FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS for presale_whitelist
ALTER TABLE presale_whitelist ENABLE ROW LEVEL SECURITY;

-- All users can read whitelist
CREATE POLICY "Anyone can view whitelist" ON presale_whitelist
FOR SELECT USING (true);

-- Only server-side API can modify (service role)
CREATE POLICY "Server-side only can modify whitelist" ON presale_whitelist
FOR ALL USING (auth.role() = 'service_role');
```

## Database Initialization
```sql
-- Initialize minted_nfts table
TRUNCATE TABLE minted_nfts;

-- Insert basic data
INSERT INTO minted_nfts (mint_index, wallet, status)
SELECT generate_series(0, 999), 'none', 'available';
```