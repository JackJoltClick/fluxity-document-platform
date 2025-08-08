-- Create user_field_mappings table for storing custom field mappings
CREATE TABLE IF NOT EXISTS user_field_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  target_field TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique mapping per user and source key
  UNIQUE(user_id, source_key)
);

-- Create index for faster lookups
CREATE INDEX idx_user_field_mappings_user_id ON user_field_mappings(user_id);
CREATE INDEX idx_user_field_mappings_source_key ON user_field_mappings(source_key);

-- Enable RLS (Row Level Security)
ALTER TABLE user_field_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_field_mappings
CREATE POLICY "Users can view their own field mappings" ON user_field_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own field mappings" ON user_field_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own field mappings" ON user_field_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own field mappings" ON user_field_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE user_field_mappings IS 'Stores custom field mappings created by users for document extraction';