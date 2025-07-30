-- Create corrections table for learning system
CREATE TABLE IF NOT EXISTS corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('vendor_match', 'gl_assignment', 'extraction_field')),
  original_value TEXT NOT NULL,
  corrected_value TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Optional metadata for specific correction types
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_corrections_document_id ON corrections(document_id);
CREATE INDEX IF NOT EXISTS idx_corrections_user_id ON corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_corrections_field_type ON corrections(field_type);
CREATE INDEX IF NOT EXISTS idx_corrections_created_at ON corrections(created_at);
CREATE INDEX IF NOT EXISTS idx_corrections_original_value ON corrections USING gin(to_tsvector('english', original_value));
CREATE INDEX IF NOT EXISTS idx_corrections_corrected_value ON corrections USING gin(to_tsvector('english', corrected_value));

-- Enable RLS
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;

-- RLS policies for corrections
CREATE POLICY "Users can view their own corrections" ON corrections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own corrections" ON corrections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own corrections" ON corrections
  FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_corrections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_corrections_updated_at
  BEFORE UPDATE ON corrections
  FOR EACH ROW EXECUTE FUNCTION update_corrections_updated_at();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON corrections TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;