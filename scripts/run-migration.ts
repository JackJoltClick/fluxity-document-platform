import { readFileSync } from 'fs'
import { resolve } from 'path'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'

async function runMigration() {
  try {
    console.log('🚀 Running vendor migration...')
    
    // Read the migration file
    const migrationPath = resolve(__dirname, '../supabase/migrations/20250718_create_vendors.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
    
    console.log('✅ Vendor migration completed successfully!')
    
    // Test the tables
    console.log('🔍 Testing vendor tables...')
    
    const { data: vendors, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .limit(5)
    
    if (vendorError) {
      console.error('❌ Vendor table test failed:', vendorError)
    } else {
      console.log('✅ Vendor table working:', vendors?.length, 'vendors found')
    }
    
    const { data: aliases, error: aliasError } = await supabaseAdmin
      .from('vendor_aliases')
      .select('*')
      .limit(5)
    
    if (aliasError) {
      console.error('❌ Vendor aliases table test failed:', aliasError)
    } else {
      console.log('✅ Vendor aliases table working:', aliases?.length, 'aliases found')
    }
    
    // Test the search function
    console.log('🔍 Testing search function...')
    
    const { data: searchResults, error: searchError } = await supabaseAdmin
      .rpc('search_vendors_with_aliases', {
        search_query: 'CPB',
        result_limit: 5
      })
    
    if (searchError) {
      console.error('❌ Search function test failed:', searchError)
    } else {
      console.log('✅ Search function working:', searchResults?.length, 'results found')
    }
    
  } catch (error) {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  }
}

runMigration()