const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgrnpspobiiwqyjlixoi.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm5wc3BvYmlpd3F5amxpeG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2NzU4MywiZXhwIjoyMDY4MjQzNTgzfQ.EakRUGXgI6yd8Ipvh9B5iKWx5QXqJNFJKPVvVIIBn94'

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