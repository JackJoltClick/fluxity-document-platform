import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up corrections table...')

    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('corrections')
      .select('id')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Corrections table already exists',
        table_exists: true
      })
    }

    // If it's not a "table doesn't exist" error, return the error
    if (checkError.code !== 'PGRST116') {
      throw new Error(`Unexpected error checking table: ${checkError.message}`)
    }

    // Create the table using raw SQL
    const createTableSQL = `
      -- Create corrections table for learning system
      CREATE TABLE corrections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL,
        field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('vendor_match', 'gl_assignment', 'extraction_field')),
        original_value TEXT NOT NULL,
        corrected_value TEXT NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );

      -- Create indexes for efficient querying
      CREATE INDEX idx_corrections_document_id ON corrections(document_id);
      CREATE INDEX idx_corrections_user_id ON corrections(user_id);
      CREATE INDEX idx_corrections_field_type ON corrections(field_type);
      CREATE INDEX idx_corrections_created_at ON corrections(created_at);

      -- Enable RLS
      ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;

      -- Grant permissions to authenticated users
      GRANT SELECT, INSERT, UPDATE ON corrections TO authenticated;
      GRANT USAGE ON SCHEMA public TO authenticated;
    `

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (createError) {
      console.error('❌ Error creating corrections table:', createError)
      throw createError
    }

    console.log('✅ Corrections table created successfully')

    // Test the table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('corrections')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Error testing corrections table:', testError)
      throw testError
    }

    return NextResponse.json({
      success: true,
      message: 'Corrections table created and tested successfully',
      table_exists: true
    })

  } catch (error) {
    console.error('❌ Failed to setup corrections table:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to setup corrections table',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}