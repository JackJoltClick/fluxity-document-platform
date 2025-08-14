-- Create smart_rules table for natural language rule definitions
CREATE TABLE IF NOT EXISTS smart_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gl_assignment', 'cost_center', 'extraction_hint', 'validation')),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_smart_rules_user_id ON smart_rules(user_id);
CREATE INDEX idx_smart_rules_category ON smart_rules(category);
CREATE INDEX idx_smart_rules_is_active ON smart_rules(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE smart_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own smart rules" ON smart_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own smart rules" ON smart_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smart rules" ON smart_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own smart rules" ON smart_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_smart_rules_updated_at BEFORE UPDATE
  ON smart_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE smart_rules IS 'Natural language rules for document processing automation';
COMMENT ON COLUMN smart_rules.rule_text IS 'The rule written in plain English';
COMMENT ON COLUMN smart_rules.category IS 'Type of rule: gl_assignment, cost_center, extraction_hint, validation';
COMMENT ON COLUMN smart_rules.usage_count IS 'Number of times this rule has been applied to documents';