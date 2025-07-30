-- Patch Script: Add Missing Vendor Rules Function
-- This adds the missing function and improves RLS policies

-- Add the missing vendor extraction rules function
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

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION find_vendor_extraction_rules(UUID, UUID) TO authenticated;

-- Add missing indexes that were in the separate script
CREATE INDEX IF NOT EXISTS idx_vendor_extraction_rules_active 
ON vendor_extraction_rules(is_active);

-- Add more specific RLS policies (better than the generic one)
-- First drop the existing generic policy
DROP POLICY IF EXISTS "Users can manage their own vendor extraction rules" ON vendor_extraction_rules;

-- Add specific policies for better security
CREATE POLICY "Users can view own vendor extraction rules" ON vendor_extraction_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendor extraction rules" ON vendor_extraction_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendor extraction rules" ON vendor_extraction_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendor extraction rules" ON vendor_extraction_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Update column comments to reflect current rule types (no gl_account_hint)
COMMENT ON COLUMN vendor_extraction_rules.rule_type IS 'Type of rule: extraction_hint, cost_center_hint, or validation_rule';

SELECT 'Vendor rules patch applied successfully - missing function and policies added' AS status;