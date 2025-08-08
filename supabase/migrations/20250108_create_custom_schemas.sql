-- Create custom schemas table
CREATE TABLE IF NOT EXISTS custom_schemas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create schema fields table
CREATE TABLE IF NOT EXISTS schema_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_id UUID NOT NULL REFERENCES custom_schemas(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_order INTEGER NOT NULL,
  alternative_names TEXT[],
  data_format TEXT,
  typical_locations TEXT[],
  case_sensitive BOOLEAN DEFAULT false,
  business_purpose TEXT,
  examples TEXT[],
  default_value TEXT,
  matching_list_type TEXT,
  matching_list_id UUID,
  conditional_rules JSONB DEFAULT '[]'::jsonb,
  document_types TEXT[] DEFAULT ARRAY['invoices'],
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create business rules table
CREATE TABLE IF NOT EXISTS schema_business_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_id UUID NOT NULL REFERENCES custom_schemas(id) ON DELETE CASCADE,
  field_id UUID REFERENCES schema_fields(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('vendor', 'customer', 'validation', 'processing')),
  rule_name TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_custom_schemas_user_id ON custom_schemas(user_id);
CREATE INDEX idx_schema_fields_schema_id ON schema_fields(schema_id);
CREATE INDEX idx_schema_fields_field_order ON schema_fields(schema_id, field_order);
CREATE INDEX idx_schema_business_rules_schema_id ON schema_business_rules(schema_id);
CREATE INDEX idx_schema_business_rules_field_id ON schema_business_rules(field_id);

-- Add RLS policies
ALTER TABLE custom_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_business_rules ENABLE ROW LEVEL SECURITY;

-- Policies for custom_schemas
CREATE POLICY "Users can view their own schemas" ON custom_schemas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schemas" ON custom_schemas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schemas" ON custom_schemas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schemas" ON custom_schemas
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for schema_fields
CREATE POLICY "Users can view fields of their schemas" ON schema_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_fields.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create fields for their schemas" ON schema_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_fields.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields of their schemas" ON schema_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_fields.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fields of their schemas" ON schema_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_fields.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

-- Policies for schema_business_rules
CREATE POLICY "Users can view business rules of their schemas" ON schema_business_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_business_rules.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create business rules for their schemas" ON schema_business_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_business_rules.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update business rules of their schemas" ON schema_business_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_business_rules.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete business rules of their schemas" ON schema_business_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM custom_schemas
      WHERE custom_schemas.id = schema_business_rules.schema_id
      AND custom_schemas.user_id = auth.uid()
    )
  );

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_schemas_updated_at BEFORE UPDATE ON custom_schemas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_fields_updated_at BEFORE UPDATE ON schema_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_business_rules_updated_at BEFORE UPDATE ON schema_business_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();