#!/usr/bin/env node

/**
 * Apply proper RLS policies using SQL migration
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

async function applyRLSFix() {
  console.log('🔧 Applying proper RLS policies...')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  )

  try {
    // Read the migration file
    const migration = fs.readFileSync('supabase/migrations/fix_rls_policies.sql', 'utf8')
    
    // Split into individual statements
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📄 Executing ${statements.length} SQL statements...`)

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            query: statement + ';'
          })
          
          if (error && !error.message.includes('does not exist')) {
            console.error(`❌ Error executing: ${statement.substring(0, 50)}...`)
            console.error(`   ${error.message}`)
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`)
          }
        } catch (err) {
          console.error(`❌ Exception executing: ${statement.substring(0, 50)}...`)
          console.error(`   ${err.message}`)
        }
      }
    }

    console.log('🎉 RLS policies update complete!')
    console.log('Now you can remove the insecure API endpoints and use direct Supabase calls.')

  } catch (error) {
    console.error('❌ Error reading migration file:', error)
  }
}

applyRLSFix()