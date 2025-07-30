import { supabaseAdmin } from '../src/lib/supabase/auth-server'

async function createEmailTables() {
  console.log('🚀 Creating email ingestion tables...')
  
  try {
    // 1. Create email_aliases table
    console.log('📋 Creating email_aliases table...')
    const { error: createTableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_aliases (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          email_address VARCHAR(255) NOT NULL UNIQUE,
          is_primary BOOLEAN DEFAULT false,
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_email_aliases_user_id ON email_aliases(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_aliases_email ON email_aliases(email_address);
      `
    })
    
    if (createTableError) {
      console.error('❌ Error creating email_aliases table:', createTableError)
    } else {
      console.log('✅ email_aliases table created')
    }
    
    // 2. Add columns to documents table
    console.log('📋 Adding columns to documents table...')
    const { error: alterTableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE documents 
        ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'upload' CHECK (source IN ('upload', 'email')),
        ADD COLUMN IF NOT EXISTS email_metadata JSONB;
        
        CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source);
        CREATE INDEX IF NOT EXISTS idx_documents_email_metadata ON documents USING GIN (email_metadata);
      `
    })
    
    if (alterTableError) {
      console.error('❌ Error updating documents table:', alterTableError)
    } else {
      console.log('✅ documents table updated')
    }
    
    // 3. Create helper function
    console.log('📋 Creating helper function...')
    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION find_user_by_email_alias(email_addr TEXT)
        RETURNS UUID AS $$
        DECLARE
          user_uuid UUID;
        BEGIN
          SELECT user_id INTO user_uuid
          FROM email_aliases
          WHERE email_address = email_addr AND is_verified = true
          LIMIT 1;
          
          IF user_uuid IS NULL THEN
            SELECT id INTO user_uuid
            FROM auth.users
            WHERE email = email_addr
            LIMIT 1;
          END IF;
          
          RETURN user_uuid;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })
    
    if (functionError) {
      console.error('❌ Error creating function:', functionError)
    } else {
      console.log('✅ Helper function created')
    }
    
    console.log('🎉 Email tables setup completed!')
    
  } catch (error) {
    console.error('💥 Setup failed:', error)
  }
}

createEmailTables()