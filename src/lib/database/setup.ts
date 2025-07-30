import { supabaseServer } from '@/src/lib/supabase/server'

export async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...')
    
    // Test if documents table exists
    const { data: tables, error: tablesError } = await supabaseServer
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'documents')

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      throw tablesError
    }

    const tableExists = tables && tables.length > 0
    
    if (!tableExists) {
      console.log('📋 Documents table does not exist, creating...')
      // Note: Table creation should be done via Supabase Dashboard or CLI
      // For now, we'll assume it exists or throw an error
      throw new Error('Documents table not found. Please create it via Supabase Dashboard.')
    }

    console.log('✅ Database setup completed successfully')
    return { success: true }
  } catch (error) {
    console.error('💥 Database setup error:', error)
    return { success: false, error }
  }
}

export async function checkDatabaseConnectivity() {
  try {
    const { data, error } = await supabaseServer
      .from('auth.users')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Database connectivity check failed:', error)
      return { connected: false, error }
    }

    return { connected: true }
  } catch (error) {
    console.error('💥 Database connectivity error:', error)
    return { connected: false, error }
  }
}