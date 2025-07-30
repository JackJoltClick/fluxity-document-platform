-- Stage 17: Email Document Ingestion Migration
-- This migration adds email functionality to the Fluxity app

-- 1. Create email_aliases table for mapping email addresses to users
CREATE TABLE IF NOT EXISTS email_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_aliases_user_id ON email_aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_email_aliases_email ON email_aliases(email_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_aliases_unique ON email_aliases(email_address);

-- 2. Add source and email_metadata columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'upload' CHECK (source IN ('upload', 'email')),
ADD COLUMN IF NOT EXISTS email_metadata JSONB;

-- Add index for source column
CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source);

-- 3. Create trigger to update updated_at timestamp on email_aliases
CREATE OR REPLACE FUNCTION update_email_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_aliases_updated_at
  BEFORE UPDATE ON email_aliases
  FOR EACH ROW
  EXECUTE FUNCTION update_email_aliases_updated_at();

-- 4. Add RLS (Row Level Security) policies for email_aliases
ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;

-- Users can view their own email aliases
CREATE POLICY "Users can view own email aliases" ON email_aliases
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own email aliases
CREATE POLICY "Users can insert own email aliases" ON email_aliases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own email aliases
CREATE POLICY "Users can update own email aliases" ON email_aliases
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own email aliases
CREATE POLICY "Users can delete own email aliases" ON email_aliases
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create function to find user by email alias
CREATE OR REPLACE FUNCTION find_user_by_email_alias(email_addr TEXT)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- First try to find in email_aliases table
  SELECT user_id INTO user_uuid
  FROM email_aliases
  WHERE email_address = email_addr AND is_verified = true
  LIMIT 1;
  
  -- If not found, try to find in auth.users table (primary email)
  IF user_uuid IS NULL THEN
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = email_addr
    LIMIT 1;
  END IF;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add comment explaining the new columns
COMMENT ON COLUMN documents.source IS 'Source of the document: upload (manual upload) or email (from email ingestion)';
COMMENT ON COLUMN documents.email_metadata IS 'JSON metadata for email-sourced documents containing sender, subject, message_id, etc.';

-- 7. Create indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_documents_email_metadata ON documents USING GIN (email_metadata);

-- Migration complete message
SELECT 'Stage 17: Email ingestion migration completed successfully' AS status;