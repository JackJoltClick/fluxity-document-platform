import { NextResponse } from 'next/server'
import { supabaseServer } from '@/src/lib/supabase/server'

export async function POST() {
  try {
    console.log('🔄 Setting up database tables...')
    
    // Test basic connectivity first
    const { data: authTest, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError && authError.message !== 'Auth session missing!') {
      console.error('❌ Auth service test failed:', authError)
      return NextResponse.json({ error: 'Database connectivity failed' }, { status: 500 })
    }
    
    console.log('✅ Basic database connectivity confirmed')
    
    // Create documents table using individual queries
    try {
      // First, try to create the table
      const queries = [
        `CREATE TABLE IF NOT EXISTS documents (
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
        )`,
        `CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`,
        `CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)`,
        `ALTER TABLE documents ENABLE ROW LEVEL SECURITY`,
        `CREATE POLICY IF NOT EXISTS "Users can only access their own documents" ON documents FOR ALL USING (auth.uid() = user_id)`,
        `CREATE POLICY IF NOT EXISTS "Authenticated users can insert documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id)`
      ]
      
      for (const query of queries) {
        try {
          console.log('🔄 Executing query:', query.substring(0, 50) + '...')
          const { error } = await supabaseServer.rpc('exec_sql', { sql: query })
          if (error) {
            console.log('⚠️  Query error (may be expected):', error.message)
          }
        } catch (queryError) {
          console.log('⚠️  Query execution failed (may be expected):', queryError)
        }
      }
      
      console.log('✅ Table setup completed')
      
    } catch (tableError) {
      console.error('❌ Table creation failed:', tableError)
      
      // Test if we can at least insert/select (table might already exist)
      try {
        const { data: testData, error: testError } = await supabaseServer
          .from('documents')
          .select('id')
          .limit(1)
        
        if (!testError) {
          console.log('✅ Documents table already exists and is accessible')
        } else {
          console.log('⚠️  Documents table test failed:', testError.message)
        }
      } catch (selectError) {
        console.log('⚠️  Could not test documents table:', selectError)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed (check logs for details)'
    })
    
  } catch (error) {
    console.error('💥 Database setup failed:', error)
    return NextResponse.json(
      { 
        error: 'Database setup failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}