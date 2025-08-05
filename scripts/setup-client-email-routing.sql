-- Setup Client Email Routing for Multi-Tenant Document Processing
-- This allows different clients to email documents to their own unique addresses

-- Ensure email_aliases table exists
CREATE TABLE IF NOT EXISTS email_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_aliases_user_id ON email_aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_email_aliases_email_address ON email_aliases(email_address);
CREATE INDEX IF NOT EXISTS idx_email_aliases_verified ON email_aliases(email_address) WHERE is_verified = true;

-- Create RLS policies
ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own email aliases
CREATE POLICY "Users can view own email aliases" ON email_aliases
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own email aliases  
CREATE POLICY "Users can insert own email aliases" ON email_aliases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own email aliases
CREATE POLICY "Users can update own email aliases" ON email_aliases
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Service role can access all (for webhook processing)
CREATE POLICY "Service role can access all email aliases" ON email_aliases
  FOR ALL USING (auth.role() = 'service_role');

-- Example client email aliases (replace with actual user IDs)
-- IMPORTANT: Replace these UUIDs with actual user IDs from your auth.users table

-- Example: Client 1
-- INSERT INTO email_aliases (user_id, email_address, is_verified) VALUES
-- ('your-client-1-user-id-here', 'client1@fluxity.ai', true);

-- Example: Client 2  
-- INSERT INTO email_aliases (user_id, email_address, is_verified) VALUES
-- ('your-client-2-user-id-here', 'client2@fluxity.ai', true);

-- Example: Client 3
-- INSERT INTO email_aliases (user_id, email_address, is_verified) VALUES
-- ('your-client-3-user-id-here', 'client3@fluxity.ai', true);

-- Function to find user by email alias (used by webhook)
CREATE OR REPLACE FUNCTION find_user_by_email_alias(email_addr TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- First check email_aliases table
  SELECT user_id INTO user_uuid
  FROM email_aliases 
  WHERE email_address = email_addr 
  AND is_verified = true
  LIMIT 1;
  
  -- If not found, check auth.users table
  IF user_uuid IS NULL THEN
    SELECT id INTO user_uuid
    FROM auth.users 
    WHERE email = email_addr
    LIMIT 1;
  END IF;
  
  RETURN user_uuid;
END;
$$;

-- Grant execute permission to service role (for webhook)
GRANT EXECUTE ON FUNCTION find_user_by_email_alias(TEXT) TO service_role;

-- Comments for documentation
COMMENT ON TABLE email_aliases IS 'Maps client-specific email addresses to user accounts for document routing';
COMMENT ON FUNCTION find_user_by_email_alias(TEXT) IS 'Finds user ID by email address, checking both aliases and auth.users';

-- Display setup instructions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Client Email Routing Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Add email aliases for your clients:';
  RAISE NOTICE '   INSERT INTO email_aliases (user_id, email_address, is_verified) VALUES';
  RAISE NOTICE '   (''user-uuid-here'', ''client1@fluxity.ai'', true);';
  RAISE NOTICE '';
  RAISE NOTICE '2. Configure Mailgun domain to route emails to your webhook';
  RAISE NOTICE '3. Set MAILGUN_SIGNING_KEY environment variable';
  RAISE NOTICE '';
  RAISE NOTICE 'Now clients can email documents to their unique addresses!';
END;
$$;