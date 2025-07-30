-- Stage 17B: Company GL Rules Engine Migration
-- This migration adds GL rules functionality to the Fluxity app

-- 1. Create company_gl_rules table for rule definitions
CREATE TABLE IF NOT EXISTS company_gl_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_gl_rules_user_id ON company_gl_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_company_gl_rules_priority ON company_gl_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_company_gl_rules_is_active ON company_gl_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_company_gl_rules_conditions ON company_gl_rules USING GIN (conditions);

-- 2. Create gl_rule_applications table for tracking rule usage
CREATE TABLE IF NOT EXISTS gl_rule_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES company_gl_rules(id) ON DELETE CASCADE,
  line_item_index INTEGER NOT NULL,
  applied_gl_code VARCHAR(255) NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  was_overridden BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gl_rule_applications_document_id ON gl_rule_applications(document_id);
CREATE INDEX IF NOT EXISTS idx_gl_rule_applications_rule_id ON gl_rule_applications(rule_id);
CREATE INDEX IF NOT EXISTS idx_gl_rule_applications_applied_at ON gl_rule_applications(applied_at DESC);

-- 3. Create trigger to update updated_at timestamp on company_gl_rules
CREATE OR REPLACE FUNCTION update_company_gl_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_gl_rules_updated_at
  BEFORE UPDATE ON company_gl_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_company_gl_rules_updated_at();

-- 4. Add RLS (Row Level Security) policies for company_gl_rules
ALTER TABLE company_gl_rules ENABLE ROW LEVEL SECURITY;

-- Users can view their own GL rules
CREATE POLICY "Users can view own GL rules" ON company_gl_rules
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own GL rules
CREATE POLICY "Users can insert own GL rules" ON company_gl_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own GL rules
CREATE POLICY "Users can update own GL rules" ON company_gl_rules
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own GL rules
CREATE POLICY "Users can delete own GL rules" ON company_gl_rules
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Add RLS policies for gl_rule_applications
ALTER TABLE gl_rule_applications ENABLE ROW LEVEL SECURITY;

-- Users can view rule applications for their documents
CREATE POLICY "Users can view own rule applications" ON gl_rule_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = gl_rule_applications.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Users can insert rule applications for their documents
CREATE POLICY "Users can insert own rule applications" ON gl_rule_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = gl_rule_applications.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Users can update rule applications for their documents
CREATE POLICY "Users can update own rule applications" ON gl_rule_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = gl_rule_applications.document_id
      AND d.user_id = auth.uid()
    )
  );

-- 6. Create function to get rule application stats
CREATE OR REPLACE FUNCTION get_rule_application_stats(rule_uuid UUID)
RETURNS TABLE (
  total_applications BIGINT,
  successful_applications BIGINT,
  override_rate NUMERIC,
  last_applied_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_applications,
    COUNT(*) FILTER (WHERE NOT was_overridden)::BIGINT as successful_applications,
    ROUND(
      COUNT(*) FILTER (WHERE was_overridden)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 
      2
    ) as override_rate,
    MAX(applied_at) as last_applied_at
  FROM gl_rule_applications
  WHERE rule_id = rule_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add comments explaining the tables
COMMENT ON TABLE company_gl_rules IS 'Stores company-specific GL code assignment rules with conditions and actions';
COMMENT ON TABLE gl_rule_applications IS 'Tracks when and how GL rules are applied to document line items';

COMMENT ON COLUMN company_gl_rules.conditions IS 'JSON object containing rule conditions like vendor_patterns, amount_range, keywords, etc.';
COMMENT ON COLUMN company_gl_rules.actions IS 'JSON object containing actions like gl_code, auto_assign, requires_approval, etc.';
COMMENT ON COLUMN gl_rule_applications.line_item_index IS 'Index of the line item in the document (0-based)';
COMMENT ON COLUMN gl_rule_applications.was_overridden IS 'True if user manually changed the GL code after rule application';

-- Migration complete message
SELECT 'Stage 17B: GL Rules Engine migration completed successfully' AS status;