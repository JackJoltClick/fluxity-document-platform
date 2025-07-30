import { supabaseAdmin } from '@/src/lib/supabase/admin'

async function setupCorrectionsTable() {
  try {
    console.log('🔧 Setting up corrections table...')

    // Create corrections table
    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create corrections table for learning system
        CREATE TABLE IF NOT EXISTS corrections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('vendor_match', 'gl_assignment', 'extraction_field')),
          original_value TEXT NOT NULL,
          corrected_value TEXT NOT NULL,
          user_id UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );

        -- Create indexes for efficient querying
        CREATE INDEX IF NOT EXISTS idx_corrections_document_id ON corrections(document_id);
        CREATE INDEX IF NOT EXISTS idx_corrections_user_id ON corrections(user_id);
        CREATE INDEX IF NOT EXISTS idx_corrections_field_type ON corrections(field_type);
        CREATE INDEX IF NOT EXISTS idx_corrections_created_at ON corrections(created_at);

        -- Enable RLS
        ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;

        -- RLS policies for corrections
        DROP POLICY IF EXISTS "Users can view their own corrections" ON corrections;
        CREATE POLICY "Users can view their own corrections" ON corrections
          FOR SELECT USING (auth.uid()::text = user_id::text);

        DROP POLICY IF EXISTS "Users can insert their own corrections" ON corrections;
        CREATE POLICY "Users can insert their own corrections" ON corrections
          FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

        DROP POLICY IF EXISTS "Users can update their own corrections" ON corrections;
        CREATE POLICY "Users can update their own corrections" ON corrections
          FOR UPDATE USING (auth.uid()::text = user_id::text);

        -- Add updated_at trigger
        CREATE OR REPLACE FUNCTION update_corrections_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_update_corrections_updated_at ON corrections;
        CREATE TRIGGER trigger_update_corrections_updated_at
          BEFORE UPDATE ON corrections
          FOR EACH ROW EXECUTE FUNCTION update_corrections_updated_at();
      `
    })

    if (tableError) {
      console.error('❌ Error creating corrections table:', tableError)
      throw tableError
    }

    console.log('✅ Corrections table created successfully')

    // Test the table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('corrections')
      .select('*')
      .limit(1)

    if (testError && testError.code !== 'PGRST116') {
      console.error('❌ Error testing corrections table:', testError)
      throw testError
    }

    console.log('✅ Corrections table is working correctly')
    return true

  } catch (error) {
    console.error('❌ Failed to setup corrections table:', error)
    throw error
  }
}

setupCorrectionsTable()
  .then(() => {
    console.log('🎉 Corrections table setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })