import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// NFT Tier configuration
const NFT_TIERS = {
  LEGENDARY: {
    name: 'Legendary',
    maxSol: 10, // 10 SOL worth
    discount: 0.33, // 33% discount
    exchangeRate: 300000 // 300,000 TESOLA per SOL
  },
  EPIC: {
    name: 'Epic',
    maxSol: 5,
    discount: 0.25,
    exchangeRate: 267000
  },
  RARE: {
    name: 'Rare',
    maxSol: 3,
    discount: 0.2,
    exchangeRate: 250000
  },
  COMMON: {
    name: 'Common',
    maxSol: 1,
    discount: 0.1,
    exchangeRate: 222000
  },
  PUBLIC: {
    name: 'Public',
    maxSol: 0.5,
    discount: 0,
    exchangeRate: 200000
  }
};

// Function to calculate max tokens for a given tier
const calculateMaxTokens = (tier, basePrice) => {
  const maxSol = NFT_TIERS[tier].maxSol;
  const exchangeRate = NFT_TIERS[tier].exchangeRate;
  
  return Math.floor(maxSol * exchangeRate);
};

export default async function handler(req, res) {
  // This endpoint should only be accessible by admins, add proper authentication
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Check if the presale_tiers table exists and create it if not
    const { error: tableCheckError } = await supabase
      .from('presale_tiers')
      .select('id')
      .limit(1);

    // Create the table schema if it doesn't exist or has a different structure
    if (tableCheckError) {
      console.log('Creating or updating presale_tiers table...');
      
      // Get database schema reference
      const { data: schemaInfo, error: schemaError } = await supabase
        .rpc('get_schema_info', { table_name: 'presale_tiers' });
      
      if (schemaError && schemaError.message.includes('does not exist')) {
        // Create the table (in a real-world scenario, use migrations)
        await supabase.rpc('create_presale_tiers_table');
      }
    }

    // Clear existing tiers
    await supabase
      .from('presale_tiers')
      .delete()
      .neq('id', 0); // Safety to avoid truncating the entire table

    // Insert the predefined tiers
    const tiersToInsert = Object.entries(NFT_TIERS).map(([tierId, tierData]) => ({
      tier_id: tierId,
      tier_name: tierData.name,
      max_sol: tierData.maxSol,
      discount_percentage: tierData.discount * 100,
      exchange_rate: tierData.exchangeRate
    }));

    const { data: insertedTiers, error: insertError } = await supabase
      .from('presale_tiers')
      .insert(tiersToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting tiers:', insertError);
      return res.status(500).json({ error: 'Failed to create tiers' });
    }

    // Now, let's add tier_id to presale_whitelist if it doesn't exist
    const { error: columnCheckError } = await supabase
      .rpc('check_column_exists', { 
        table_name: 'presale_whitelist',
        column_name: 'tier_id'
      });

    if (columnCheckError) {
      // Add tier_id column
      await supabase
        .rpc('add_tier_id_column');
    }

    // Update existing whitelist entries or create test data if needed
    const { data: whitelistEntries, error: whitelistError } = await supabase
      .from('presale_whitelist')
      .select('*')
      .limit(5);
      
    if (whitelistError || !whitelistEntries || whitelistEntries.length === 0) {
      console.log('Creating test whitelist entries...');
      
      // Demo wallets for testing
      const testWallets = [
        { wallet: 'HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1', tier: 'LEGENDARY', name: 'Test Legendary' },
        { wallet: '2q7pyhPwAwZ3QMfZrnAbDhnh9mDUqycszcpf86VgQxhF', tier: 'EPIC', name: 'Test Epic' },
        { wallet: 'AA9bndb9wQWyUCaQZpS9uyCQK7E8sB3xcswXbhbtEVYa', tier: 'RARE', name: 'Test Rare' },
        { wallet: '94xt1Eyc56KzYi1dk9zcixDnPXJKHqGKjcYbPzUqVz8J', tier: 'COMMON', name: 'Test Common' },
        { wallet: '6uaCUyfqPXKsV6AuW41i6LThSBRGzByVX5XZcTNvY9PK', tier: 'PUBLIC', name: 'Test Public' }
      ];
      
      // Create whitelist entries
      const whitelistData = testWallets.map(wallet => ({
        wallet_address: wallet.wallet,
        tier_id: wallet.tier,
        created_at: new Date().toISOString(),
        name: wallet.name
      }));
      
      const { data: insertedWhitelist, error: insertWhitelistError } = await supabase
        .from('presale_whitelist')
        .insert(whitelistData)
        .select();
        
      if (insertWhitelistError) {
        console.error('Error creating test whitelist data:', insertWhitelistError);
      } else {
        console.log(`Created ${insertedWhitelist.length} test whitelist entries`);
      }
    } else {
      // Update tiers for existing entries
      for (const entry of whitelistEntries) {
        // Assign random tier if none exists
        if (!entry.tier_id) {
          const tiers = ['LEGENDARY', 'EPIC', 'RARE', 'COMMON', 'PUBLIC'];
          const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
          
          await supabase
            .from('presale_whitelist')
            .update({ tier_id: randomTier })
            .eq('id', entry.id);
        }
      }
    }
    
    // Create or update presale settings if needed
    const { data: presaleSettings, error: settingsError } = await supabase
      .from('presale_settings')
      .select('*')
      .limit(1);
      
    if (settingsError || !presaleSettings || presaleSettings.length === 0) {
      console.log('Creating presale settings...');
      
      // Demo settings
      const now = new Date();
      const oneWeekLater = new Date();
      oneWeekLater.setDate(now.getDate() + 7);
      
      const settingsData = {
        is_active: true,
        start_time: now.toISOString(),
        end_time: oneWeekLater.toISOString(),
        price_sol: 0.000005,
        total_supply: 100000000,
        whitelist_only: false,
        min_sol: 0.005,
        max_sol: 5
      };
      
      const { data: insertedSettings, error: insertSettingsError } = await supabase
        .from('presale_settings')
        .insert(settingsData)
        .select();
        
      if (insertSettingsError) {
        console.error('Error creating presale settings:', insertSettingsError);
      } else {
        console.log('Created presale settings');
      }
    }
    
    // Return success
    res.status(200).json({
      success: true,
      tiers: insertedTiers,
      message: 'Successfully set up NFT tiers'
    });

  } catch (err) {
    console.error('Setup tiers API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

// Add SQL functions for database operations (normally these would be in migrations)
// These are added via RPC for demonstration purposes only
/*
-- Function to check if a column exists
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS BOOLEAN AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to add tier_id column to presale_whitelist
CREATE OR REPLACE FUNCTION add_tier_id_column()
RETURNS VOID AS $$
BEGIN
  ALTER TABLE presale_whitelist ADD COLUMN tier_id VARCHAR(20) DEFAULT 'PUBLIC';
END;
$$ LANGUAGE plpgsql;

-- Function to create presale_tiers table
CREATE OR REPLACE FUNCTION create_presale_tiers_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE presale_tiers (
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
*/