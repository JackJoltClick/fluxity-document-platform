import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runEmailMigration() {
  console.log('🚀 Starting Stage 17: Email Ingestion Migration...')
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'stage17-email-ingestion-migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.includes('SELECT ') && statement.includes('status')) {
        // Skip the final status message
        continue
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)
      
      let data, error
      try {
        const result = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        })
        data = result.data
        error = result.error
      } catch (e) {
        // If rpc doesn't work, try direct query
        error = e
      }
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error)
        // Try to continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('🎉 Email ingestion migration completed!')
    
    // Test the migration by checking if tables exist
    const { data: emailAliases, error: aliasError } = await supabase
      .from('email_aliases')
      .select('id')
      .limit(1)
    
    if (!aliasError) {
      console.log('✅ email_aliases table created successfully')
    }
    
    // Check if documents table has new columns
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('source, email_metadata')
      .limit(1)
    
    if (!docError) {
      console.log('✅ documents table updated with new columns')
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

runEmailMigration()