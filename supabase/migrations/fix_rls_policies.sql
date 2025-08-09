-- Fix RLS Policies for Client Schemas and Email Aliases
-- This creates proper row-level security that follows best practices

-- First, ensure RLS is enabled
ALTER TABLE client_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own client schemas" ON client_schemas;
DROP POLICY IF EXISTS "Users can insert own client schemas" ON client_schemas;
DROP POLICY IF EXISTS "Users can update own client schemas" ON client_schemas;
DROP POLICY IF EXISTS "Users can delete own client schemas" ON client_schemas;

DROP POLICY IF EXISTS "Users can view own email aliases" ON email_aliases;
DROP POLICY IF EXISTS "Users can insert own email aliases" ON email_aliases;
DROP POLICY IF EXISTS "Users can update own email aliases" ON email_aliases;
DROP POLICY IF EXISTS "Users can delete own email aliases" ON email_aliases;

-- Create proper RLS policies for client_schemas
CREATE POLICY "Users can view own client schemas" ON client_schemas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client schemas" ON client_schemas  
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client schemas" ON client_schemas
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client schemas" ON client_schemas
    FOR DELETE USING (auth.uid() = user_id);

-- Create proper RLS policies for email_aliases  
CREATE POLICY "Users can view own email aliases" ON email_aliases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email aliases" ON email_aliases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email aliases" ON email_aliases
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email aliases" ON email_aliases
    FOR DELETE USING (auth.uid() = user_id);

-- Test the policies work by checking auth.uid() function
SELECT 'RLS policies created successfully. auth.uid() function: ' || COALESCE(auth.uid()::text, 'NULL') AS status;