const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTable() {
  try {
    console.log('Creating documents table...')
    
    // First, try to create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            filename TEXT NOT NULL,
            file_url TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'uploaded',
            extracted_data JSONB DEFAULT NULL,
            extraction_method TEXT DEFAULT NULL,
            extraction_cost DECIMAL(10,4) DEFAULT 0.0000,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    })

    if (error) {
      console.error('Error creating table:', error)
      
      // Try a different approach - check if we can test the table
      const { data: testData, error: testError } = await supabase
        .from('documents')
        .select('*')
        .limit(1)
      
      if (testError) {
        console.error('Table test failed:', testError)
      } else {
        console.log('Table already exists or was created successfully')
      }
    } else {
      console.log('Table created successfully')
    }
    
  } catch (error) {
    console.error('Failed to create table:', error)
  }
}

createTable()