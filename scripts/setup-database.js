const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDocumentsTable() {
  try {
    console.log('🔄 Creating documents table...')
    
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            file_url TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'uploaded',
            extracted_data JSONB DEFAULT NULL,
            extraction_method TEXT DEFAULT NULL,
            extraction_cost DECIMAL(10,4) DEFAULT 0.0000,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
        CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
        
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can only access their own documents" ON documents
            FOR ALL USING (auth.uid() = user_id);
        
        CREATE POLICY "Authenticated users can insert documents" ON documents
            FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    })

    if (error) {
      console.error('❌ Error creating table:', error)
      throw error
    }

    console.log('✅ Documents table created successfully')
    return true
  } catch (error) {
    console.error('💥 Database setup failed:', error)
    
    // Try alternative method - direct table creation
    try {
      console.log('🔄 Trying direct table creation...')
      
      // Test if we can at least query the database
      const { data: testData, error: testError } = await supabase
        .from('auth.users')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('❌ Database connection failed:', testError)
        return false
      }

      console.log('✅ Database connection successful')
      console.log('ℹ️  Please create the documents table manually using the SQL in scripts/create-documents-table.sql')
      return false
    } catch (fallbackError) {
      console.error('💥 Fallback failed:', fallbackError)
      return false
    }
  }
}

if (require.main === module) {
  createDocumentsTable()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { createDocumentsTable }