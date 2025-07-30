-- Stage 19: Create Business Logic Mapping Tables
-- This migration adds tables to support intelligent mapping between extracted data and accounting fields

-- 1. Company Mappings Table
-- Maps supplier names to internal company codes
CREATE TABLE IF NOT EXISTS company_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  company_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_mappings_user_id ON company_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_company_mappings_supplier_name ON company_mappings(supplier_name);
CREATE INDEX IF NOT EXISTS idx_company_mappings_company_code ON company_mappings(company_code);
CREATE INDEX IF NOT EXISTS idx_company_mappings_active ON company_mappings(is_active);

-- 2. GL Mappings Table
-- Maps keywords and descriptions to GL accounts
CREATE TABLE IF NOT EXISTS gl_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keywords TEXT[] NOT NULL,
  gl_account TEXT NOT NULL,
  description TEXT,
  department TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gl_mappings_user_id ON gl_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_gl_mappings_keywords ON gl_mappings USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_gl_mappings_gl_account ON gl_mappings(gl_account);
CREATE INDEX IF NOT EXISTS idx_gl_mappings_priority ON gl_mappings(priority DESC);
CREATE INDEX IF NOT EXISTS idx_gl_mappings_active ON gl_mappings(is_active);

-- 3. Cost Center Rules Table
-- Maps supplier and description patterns to cost centers
CREATE TABLE IF NOT EXISTS cost_center_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  supplier_pattern TEXT,
  description_pattern TEXT,
  cost_center TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cost_center_rules_user_id ON cost_center_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_rules_supplier_pattern ON cost_center_rules(supplier_pattern);
CREATE INDEX IF NOT EXISTS idx_cost_center_rules_priority ON cost_center_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_cost_center_rules_active ON cost_center_rules(is_active);

-- 4. Business Logic Audit Log Table
-- Tracks mapping decisions for audit and improvement
CREATE TABLE IF NOT EXISTS business_logic_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  input_value TEXT,
  output_value TEXT,
  confidence_score DECIMAL(3,2),
  reasoning TEXT,
  mapping_source TEXT, -- 'company_mapping', 'gl_mapping', 'cost_center_rule', 'default'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audit log
CREATE INDEX IF NOT EXISTS idx_business_logic_audit_document_id ON business_logic_audit(document_id);
CREATE INDEX IF NOT EXISTS idx_business_logic_audit_field_name ON business_logic_audit(field_name);
CREATE INDEX IF NOT EXISTS idx_business_logic_audit_created_at ON business_logic_audit(created_at DESC);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_business_logic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_mappings_updated_at
  BEFORE UPDATE ON company_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_logic_updated_at();

CREATE TRIGGER gl_mappings_updated_at
  BEFORE UPDATE ON gl_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_logic_updated_at();

CREATE TRIGGER cost_center_rules_updated_at
  BEFORE UPDATE ON cost_center_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_business_logic_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE company_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_center_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_logic_audit ENABLE ROW LEVEL SECURITY;

-- Company mappings policies
CREATE POLICY "Users can view own company mappings" ON company_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company mappings" ON company_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company mappings" ON company_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company mappings" ON company_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- GL mappings policies
CREATE POLICY "Users can view own GL mappings" ON gl_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GL mappings" ON gl_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GL mappings" ON gl_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GL mappings" ON gl_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- Cost center rules policies
CREATE POLICY "Users can view own cost center rules" ON cost_center_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost center rules" ON cost_center_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost center rules" ON cost_center_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost center rules" ON cost_center_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Audit log policies (users can only view audit logs for their documents)
CREATE POLICY "Users can view audit logs for own documents" ON business_logic_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = business_logic_audit.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs" ON business_logic_audit
  FOR INSERT WITH CHECK (true); -- Allow system to insert audit logs

-- Create functions for fuzzy matching
CREATE OR REPLACE FUNCTION calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  -- Simple similarity calculation using Levenshtein distance
  -- Returns value between 0 and 1 (1 = identical, 0 = completely different)
  RETURN 1.0 - (levenshtein(LOWER(text1), LOWER(text2))::DECIMAL / GREATEST(LENGTH(text1), LENGTH(text2)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find best company mapping
CREATE OR REPLACE FUNCTION find_company_mapping(supplier_name_param TEXT, user_id_param UUID)
RETURNS TABLE (
  company_code TEXT,
  confidence DECIMAL(3,2),
  matched_supplier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.company_code,
    calculate_similarity(supplier_name_param, cm.supplier_name) as confidence,
    cm.supplier_name as matched_supplier
  FROM company_mappings cm
  WHERE cm.user_id = user_id_param 
    AND cm.is_active = true
    AND calculate_similarity(supplier_name_param, cm.supplier_name) >= 0.7
  ORDER BY confidence DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find GL account mapping
CREATE OR REPLACE FUNCTION find_gl_mapping(description_param TEXT, user_id_param UUID)
RETURNS TABLE (
  gl_account TEXT,
  confidence DECIMAL(3,2),
  matched_keywords TEXT[],
  description TEXT
) AS $$
DECLARE
  keyword TEXT;
  match_count INTEGER := 0;
  total_keywords INTEGER;
  mapping_record RECORD;
  best_mapping RECORD;
  best_confidence DECIMAL(3,2) := 0;
BEGIN
  -- Find GL mapping with highest keyword match percentage
  FOR mapping_record IN 
    SELECT gm.gl_account, gm.keywords, gm.description, gm.priority
    FROM gl_mappings gm
    WHERE gm.user_id = user_id_param AND gm.is_active = true
    ORDER BY gm.priority DESC
  LOOP
    match_count := 0;
    total_keywords := array_length(mapping_record.keywords, 1);
    
    -- Count keyword matches in description
    FOREACH keyword IN ARRAY mapping_record.keywords
    LOOP
      IF LOWER(description_param) LIKE '%' || LOWER(keyword) || '%' THEN
        match_count := match_count + 1;
      END IF;
    END LOOP;
    
    -- Calculate confidence as percentage of matched keywords
    IF total_keywords > 0 THEN
      DECLARE
        current_confidence DECIMAL(3,2) := (match_count::DECIMAL / total_keywords::DECIMAL);
      BEGIN
        IF current_confidence > best_confidence THEN
          best_confidence := current_confidence;
          best_mapping := mapping_record;
        END IF;
      END;
    END IF;
  END LOOP;
  
  -- Return best mapping if confidence >= 0.5
  IF best_confidence >= 0.5 THEN
    RETURN QUERY SELECT 
      best_mapping.gl_account,
      best_confidence,
      best_mapping.keywords,
      best_mapping.description;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments explaining the tables
COMMENT ON TABLE company_mappings IS 'Maps supplier names to internal company codes using fuzzy matching';
COMMENT ON TABLE gl_mappings IS 'Maps keywords in descriptions to GL accounts with priority-based matching';
COMMENT ON TABLE cost_center_rules IS 'Rules for determining cost centers based on supplier and description patterns';
COMMENT ON TABLE business_logic_audit IS 'Audit trail of business logic mapping decisions for transparency';

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_similarity(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION find_company_mapping(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_gl_mapping(TEXT, UUID) TO authenticated;

-- Migration complete message
SELECT 'Stage 19: Business Logic Tables migration completed successfully' AS status;