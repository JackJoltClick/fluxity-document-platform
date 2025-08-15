-- Update Smart Rules categories to be clearer
-- extraction: How to find/read data in the document
-- assignment: Direct value overrides (no list lookup needed)  
-- matching: Business logic that requires ERP list matching

-- First, update the check constraint to allow new categories
ALTER TABLE smart_rules DROP CONSTRAINT IF EXISTS smart_rules_category_check;

ALTER TABLE smart_rules ADD CONSTRAINT smart_rules_category_check 
CHECK (category IN ('extraction', 'assignment', 'matching'));

-- Migrate existing data to new categories
UPDATE smart_rules SET category = 
  CASE 
    -- extraction_hint that are about WHERE/HOW to find data stay as extraction
    WHEN category = 'extraction_hint' AND (
      rule_text ILIKE '%top%' OR 
      rule_text ILIKE '%bottom%' OR 
      rule_text ILIKE '%corner%' OR 
      rule_text ILIKE '%format%' OR
      rule_text ILIKE '%appears%' OR
      rule_text ILIKE '%located%'
    ) THEN 'extraction'
    
    -- extraction_hint that assign specific values become assignment
    WHEN category = 'extraction_hint' THEN 'assignment'
    
    -- cost_center and gl_assignment become matching
    WHEN category IN ('cost_center', 'gl_assignment') THEN 'matching'
    
    -- validation category is removed (validation is automatic, not rule-based)
    WHEN category = 'validation' THEN 'matching'
    
    ELSE category
  END
WHERE category IN ('extraction_hint', 'cost_center', 'gl_assignment', 'validation');

-- Add a comment to explain the categories
COMMENT ON COLUMN smart_rules.category IS 'Rule category: extraction (how to read document), assignment (direct value overrides), matching (business logic requiring ERP lookups)';