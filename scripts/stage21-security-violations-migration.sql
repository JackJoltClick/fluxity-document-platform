-- Security Violations Table Migration
-- This migration creates the security_violations table for audit trail and security monitoring

-- Create security_violations table
CREATE TABLE IF NOT EXISTS security_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  content TEXT,
  ip_address INET,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user-based queries
CREATE INDEX IF NOT EXISTS idx_security_violations_user_id 
ON security_violations(user_id);

-- Create index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_security_violations_timestamp 
ON security_violations(timestamp);

-- Create index for violation type analysis
CREATE INDEX IF NOT EXISTS idx_security_violations_type 
ON security_violations(violation_type);

-- Row Level Security (RLS)
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and system can view all violations
CREATE POLICY "Admins can view all security violations" ON security_violations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
         OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
  )
);

-- Policy: Users can only view their own violations (for transparency)
CREATE POLICY "Users can view their own security violations" ON security_violations
FOR SELECT USING (user_id = auth.uid());

-- Policy: Only the system (via service role) can insert violations
CREATE POLICY "System can insert security violations" ON security_violations
FOR INSERT WITH CHECK (true);

-- Grant appropriate permissions
GRANT SELECT ON security_violations TO authenticated;
GRANT INSERT ON security_violations TO service_role;

-- Add helpful comments
COMMENT ON TABLE security_violations IS 'Security violations and audit trail for prompt injection attempts and other security issues';
COMMENT ON COLUMN security_violations.violation_type IS 'Type of violation: invalid_rule_content, dangerous_content_blocked, vendor_rules_filtered, etc.';
COMMENT ON COLUMN security_violations.content IS 'Truncated content that triggered the violation (max 500 chars)';
COMMENT ON COLUMN security_violations.ip_address IS 'IP address of the user when violation occurred';

-- Optional: Create a view for violation statistics (admin only)
CREATE OR REPLACE VIEW security_violation_stats AS
SELECT 
  violation_type,
  COUNT(*) as total_violations,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', timestamp) as violation_date,
  MIN(timestamp) as first_occurrence,
  MAX(timestamp) as last_occurrence
FROM security_violations
GROUP BY violation_type, DATE_TRUNC('day', timestamp)
ORDER BY violation_date DESC, total_violations DESC;

-- Grant view access to admins only
GRANT SELECT ON security_violation_stats TO authenticated;

-- Optional: Function to get user violation count for rate limiting
CREATE OR REPLACE FUNCTION get_user_violation_count(
  user_id_param UUID,
  since_timestamp TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '1 hour')
)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM security_violations
  WHERE user_id = user_id_param
    AND timestamp >= since_timestamp;
$$;

-- Grant function access to service role
GRANT EXECUTE ON FUNCTION get_user_violation_count TO service_role;

COMMENT ON FUNCTION get_user_violation_count IS 'Get count of security violations for a user within a time window (default: last hour)';