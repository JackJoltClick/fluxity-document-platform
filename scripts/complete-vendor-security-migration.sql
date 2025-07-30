-- Complete Vendor Extraction Rules + Security Migration
-- This migration creates both vendor extraction rules and security monitoring infrastructure

-- =============================================================================
-- PART 1: VENDOR EXTRACTION RULES (Simplified System)
-- =============================================================================

-- Create vendor_extraction_rules table
CREATE TABLE IF NOT EXISTS vendor_extraction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('extraction_hint', 'cost_center_hint', 'validation_rule')),
  instruction TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vendor extraction rules
CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_vendor_id 
ON vendor_extraction_rules(vendor_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_user_id 
ON vendor_extraction_rules(user_id);

CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_type 
ON vendor_extraction_rules(rule_type) WHERE is_active = true;

-- Row Level Security for vendor extraction rules
ALTER TABLE vendor_extraction_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own vendor rules
CREATE POLICY "Users can manage their own vendor extraction rules" ON vendor_extraction_rules
FOR ALL USING (user_id = auth.uid());

-- Grant permissions for vendor extraction rules
GRANT ALL ON vendor_extraction_rules TO authenticated;

-- Add helpful comments
COMMENT ON TABLE vendor_extraction_rules IS 'Simplified vendor-specific extraction rules to enhance LLM prompts';
COMMENT ON COLUMN vendor_extraction_rules.rule_type IS 'Type: extraction_hint, cost_center_hint, validation_rule';
COMMENT ON COLUMN vendor_extraction_rules.instruction IS 'Simple text instruction to enhance document processing (max 200 chars)';

-- =============================================================================
-- PART 2: SECURITY VIOLATIONS TABLE
-- =============================================================================

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

-- Create indexes for security violations
CREATE INDEX IF NOT EXISTS idx_security_violations_user_id 
ON security_violations(user_id);

CREATE INDEX IF NOT EXISTS idx_security_violations_timestamp 
ON security_violations(timestamp);

CREATE INDEX IF NOT EXISTS idx_security_violations_type 
ON security_violations(violation_type);

-- Row Level Security for security violations
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all violations
CREATE POLICY "Admins can view all security violations" ON security_violations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
         OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
  )
);

-- Policy: Users can view their own violations (transparency)
CREATE POLICY "Users can view their own security violations" ON security_violations
FOR SELECT USING (user_id = auth.uid());

-- Policy: System can insert violations
CREATE POLICY "System can insert security violations" ON security_violations
FOR INSERT WITH CHECK (true);

-- Grant permissions for security violations
GRANT SELECT ON security_violations TO authenticated;
GRANT INSERT ON security_violations TO service_role;

-- Add helpful comments
COMMENT ON TABLE security_violations IS 'Security violations and audit trail for prompt injection attempts';
COMMENT ON COLUMN security_violations.violation_type IS 'Type: invalid_rule_content, dangerous_content_blocked, vendor_rules_filtered, etc.';
COMMENT ON COLUMN security_violations.content IS 'Truncated content that triggered violation (max 500 chars)';

-- =============================================================================
-- PART 3: HELPER FUNCTIONS AND VIEWS
-- =============================================================================

-- Function to get user violation count for rate limiting
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

GRANT EXECUTE ON FUNCTION get_user_violation_count TO service_role;

-- View for security violation statistics (admin only)
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

GRANT SELECT ON security_violation_stats TO authenticated;

-- =============================================================================
-- PART 4: SAMPLE DATA AND EXAMPLES
-- =============================================================================

-- Example vendor extraction rules (commented out - add manually if needed)
/*
-- Example: Office supply vendor with extraction hint
INSERT INTO vendor_extraction_rules (vendor_id, user_id, rule_type, instruction) VALUES 
('vendor-uuid', 'user-uuid', 'extraction_hint', 'Office supplies info usually in line item descriptions');

-- Example: Travel vendor with cost center hint  
INSERT INTO vendor_extraction_rules (vendor_id, user_id, rule_type, instruction) VALUES
('vendor-uuid', 'user-uuid', 'cost_center_hint', 'Travel expenses go to Cost Center TRAVEL');

-- Example: Layout hint for vendor
INSERT INTO vendor_extraction_rules (vendor_id, user_id, rule_type, instruction) VALUES
('vendor-uuid', 'user-uuid', 'extraction_hint', 'PO numbers appear in top-right corner');
*/

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Summary of what was created:
-- 1. vendor_extraction_rules table with simplified structure
-- 2. security_violations table for audit trail
-- 3. Appropriate indexes and RLS policies
-- 4. Helper functions for rate limiting and statistics
-- 5. Proper permissions and comments

SELECT 'Vendor Extraction Rules + Security Migration completed successfully!' as status;