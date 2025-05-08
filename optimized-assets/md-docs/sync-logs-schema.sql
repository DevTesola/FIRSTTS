-- Create tables for synchronization logging

-- Table for storing synchronization operation logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  operation VARCHAR(255) NOT NULL, -- Type of operation: sync_nft, sync_wallet, sync_all, etc.
  mint_address VARCHAR(255), -- Target NFT mint address (if applicable)
  wallet_address VARCHAR(255), -- Target wallet address (if applicable)
  status VARCHAR(50) NOT NULL, -- Operation status: success, error, partial
  details JSONB, -- Detailed operation results
  duration_ms INTEGER, -- Operation duration in milliseconds
  changes JSONB, -- What was changed by this operation
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- When the operation occurred
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sync_logs_operation ON sync_logs(operation);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_logs_mint_address ON sync_logs(mint_address);
CREATE INDEX IF NOT EXISTS idx_sync_logs_wallet_address ON sync_logs(wallet_address);

-- Table for storing synchronization error logs
CREATE TABLE IF NOT EXISTS sync_error_logs (
  id SERIAL PRIMARY KEY,
  operation VARCHAR(255) NOT NULL, -- Type of operation that failed
  mint_address VARCHAR(255), -- Target NFT mint address (if applicable)
  wallet_address VARCHAR(255), -- Target wallet address (if applicable)
  error_message TEXT NOT NULL, -- Error message
  error_stack TEXT, -- Error stack trace
  context JSONB, -- Additional context information
  resolved BOOLEAN DEFAULT FALSE, -- Whether the error has been resolved
  resolved_at TIMESTAMP WITH TIME ZONE, -- When the error was resolved
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- When the error occurred
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sync_error_logs_operation ON sync_error_logs(operation);
CREATE INDEX IF NOT EXISTS idx_sync_error_logs_resolved ON sync_error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_sync_error_logs_timestamp ON sync_error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_error_logs_mint_address ON sync_error_logs(mint_address);
CREATE INDEX IF NOT EXISTS idx_sync_error_logs_wallet_address ON sync_error_logs(wallet_address);

-- Add RLS policies for security
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY admin_sync_logs_policy ON sync_logs 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true));

CREATE POLICY admin_sync_error_logs_policy ON sync_error_logs 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true));

-- Comments for documentation
COMMENT ON TABLE sync_logs IS 'Logs of staking synchronization operations';
COMMENT ON TABLE sync_error_logs IS 'Logs of errors during staking synchronization';

-- Function to get daily sync stats
CREATE OR REPLACE FUNCTION get_sync_stats(days_back INTEGER DEFAULT 7, op VARCHAR DEFAULT NULL)
RETURNS TABLE (
  day DATE,
  total_syncs INTEGER,
  successful_syncs INTEGER,
  failed_syncs INTEGER,
  error_count INTEGER,
  avg_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      current_date - (days_back - 1)::integer,
      current_date,
      '1 day'::interval
    )::date AS day
  ),
  daily_logs AS (
    SELECT 
      date_trunc('day', timestamp)::date AS day,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'success') AS success,
      COUNT(*) FILTER (WHERE status = 'error') AS failed,
      AVG(duration_ms) AS avg_duration
    FROM sync_logs
    WHERE 
      timestamp >= current_date - days_back
      AND (op IS NULL OR operation = op)
    GROUP BY 1
  ),
  daily_errors AS (
    SELECT 
      date_trunc('day', timestamp)::date AS day,
      COUNT(*) AS error_count
    FROM sync_error_logs
    WHERE 
      timestamp >= current_date - days_back
      AND (op IS NULL OR operation = op)
    GROUP BY 1
  )
  SELECT 
    d.day,
    COALESCE(l.total, 0) AS total_syncs,
    COALESCE(l.success, 0) AS successful_syncs,
    COALESCE(l.failed, 0) AS failed_syncs,
    COALESCE(e.error_count, 0) AS error_count,
    COALESCE(l.avg_duration, 0) AS avg_duration
  FROM days d
  LEFT JOIN daily_logs l ON d.day = l.day
  LEFT JOIN daily_errors e ON d.day = e.day
  ORDER BY d.day;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_sync_stats IS 'Get daily statistics for staking synchronization operations';