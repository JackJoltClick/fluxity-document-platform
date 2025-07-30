-- Stage 20: Create Vendor Extraction Rules Table (Simplified)
-- This migration adds simple vendor-specific instructions for LLM prompts

-- Vendor Extraction Rules Table - Simple text instructions for LLM enhancement
CREATE TABLE IF NOT EXISTS vendor_extraction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rule type for categorization
  rule_type TEXT NOT NULL CHECK (rule_type IN ('extraction_hint', 'gl_account_hint', 'cost_center_hint', 'validation_rule')),
  
  -- Simple text instruction for LLM
  instruction TEXT NOT NULL,
  
  -- Basic metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_vendor_id ON vendor_extraction_rules(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_user_id ON vendor_extraction_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_rule_type ON vendor_extraction_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_active ON vendor_extraction_rules(is_active);

-- Add RLS (Row Level Security) policies
ALTER TABLE vendor_extraction_rules ENABLE ROW LEVEL SECURITY;

-- Vendor extraction rules policies
CREATE POLICY "Users can view own vendor extraction rules" ON vendor_extraction_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendor extraction rules" ON vendor_extraction_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendor extraction rules" ON vendor_extraction_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendor extraction rules" ON vendor_extraction_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to find vendor extraction rules
CREATE OR REPLACE FUNCTION find_vendor_extraction_rules(vendor_id_param UUID, user_id_param UUID)
RETURNS TABLE (
  id UUID,
  rule_type TEXT,
  instruction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ver.id,
    ver.rule_type,
    ver.instruction
  FROM vendor_extraction_rules ver
  WHERE ver.vendor_id = vendor_id_param 
    AND ver.user_id = user_id_param 
    AND ver.is_active = true
  ORDER BY ver.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments explaining the table
COMMENT ON TABLE vendor_extraction_rules IS 'Simple vendor-specific instructions to enhance LLM prompts during document processing';
COMMENT ON COLUMN vendor_extraction_rules.rule_type IS 'Type of rule: extraction_hint, gl_account_hint, cost_center_hint, or validation_rule';
COMMENT ON COLUMN vendor_extraction_rules.instruction IS 'Plain text instruction to add context to LLM prompts (e.g., "PO numbers are in the top-right corner")';

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_vendor_extraction_rules(UUID, UUID) TO authenticated;

-- Migration complete message
SELECT 'Stage 20: Vendor Extraction Rules migration completed successfully' AS status;