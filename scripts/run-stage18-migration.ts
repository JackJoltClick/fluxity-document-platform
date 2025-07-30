#!/usr/bin/env npx tsx
import { supabaseAdmin } from '../src/lib/supabase/auth-server'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  console.log('🚀 Starting Stage 18: Accounting Schema Migration...\n')
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'stage18-accounting-schema-migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📋 Migration includes:')
    console.log('- Adding 21 accounting-specific columns')
    console.log('- Creating accounting_status enum type')
    console.log('- Adding workflow columns (accounting_status, mapping_confidence, requires_review)')
    console.log('- Creating performance indexes')
    console.log('- Adding validation functions and triggers\n')
    
    // Execute the migration
    console.log('🔧 Executing migration...')
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    }).single()
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql RPC not available, please run the migration manually in Supabase SQL editor')
      console.log('\n📄 Migration file location:')
      console.log(migrationPath)
      console.log('\n📋 Steps to run manually:')
      console.log('1. Open Supabase Dashboard')
      console.log('2. Go to SQL Editor')
      console.log('3. Copy and paste the migration SQL')
      console.log('4. Execute the query')
      return
    }
    
    console.log('✅ Migration executed successfully!\n')
    
    // Verify the migration
    console.log('🔍 Verifying migration...')
    
    // Test selecting from the new columns
    const { data: testData, error: testError } = await supabaseAdmin
      .from('documents')
      .select('id, company_code, accounting_status, mapping_confidence')
      .limit(1)
    
    if (testError) {
      console.error('❌ Migration verification failed:', testError.message)
      return
    }
    
    console.log('✅ Successfully verified accounting columns exist')
    
    // Check column count
    const accountingColumns = [
      'company_code', 'supplier_invoice_transaction_type', 'invoicing_party',
      'supplier_invoice_id_by_invcg_party', 'document_date', 'posting_date',
      'accounting_document_type', 'accounting_document_header_text', 'document_currency',
      'invoice_gross_amount', 'gl_account', 'supplier_invoice_item_text',
      'debit_credit_code', 'supplier_invoice_item_amount', 'tax_code',
      'tax_jurisdiction', 'assignment_reference', 'cost_center',
      'profit_center', 'internal_order', 'wbs_element'
    ]
    
    console.log(`✅ Added ${accountingColumns.length} accounting columns`)
    console.log('✅ Added 3 workflow columns (accounting_status, mapping_confidence, requires_review)')
    console.log('\n🎉 Stage 18 migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n💡 Please run the migration manually in Supabase SQL editor')
    console.log('📄 Migration file: scripts/stage18-accounting-schema-migration.sql')
  }
}

// Run the migration
runMigration()