#!/usr/bin/env npx tsx
import { supabaseAdmin } from '../src/lib/supabase/auth-server'

async function testMigration() {
  console.log('🧪 Testing Stage 18: Accounting Schema Migration...\n')
  
  const tests = {
    passed: 0,
    failed: 0,
    details: [] as string[]
  }
  
  // Test 1: Check if accounting columns exist
  console.log('1️⃣  Testing accounting columns...')
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select(`
        id,
        company_code,
        supplier_invoice_transaction_type,
        invoicing_party,
        supplier_invoice_id_by_invcg_party,
        document_date,
        posting_date,
        accounting_document_type,
        accounting_document_header_text,
        document_currency,
        invoice_gross_amount,
        gl_account,
        supplier_invoice_item_text,
        debit_credit_code,
        supplier_invoice_item_amount,
        tax_code,
        tax_jurisdiction,
        assignment_reference,
        cost_center,
        profit_center,
        internal_order,
        wbs_element,
        accounting_status,
        mapping_confidence,
        requires_review
      `)
      .limit(1)
    
    if (error) {
      tests.failed++
      tests.details.push(`❌ Accounting columns test failed: ${error.message}`)
    } else {
      tests.passed++
      tests.details.push('✅ All 24 accounting columns exist')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Accounting columns test error: ${error}`)
  }
  
  // Test 2: Check enum type
  console.log('2️⃣  Testing accounting_status enum...')
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        filename: 'test-accounting.pdf',
        file_url: 'https://test.com/test.pdf',
        status: 'pending',
        accounting_status: 'needs_mapping'
      })
      .select('id, accounting_status')
      .single()
    
    if (error && !error.message.includes('violates foreign key')) {
      tests.failed++
      tests.details.push(`❌ Enum type test failed: ${error.message}`)
    } else {
      tests.passed++
      tests.details.push('✅ accounting_status enum type works correctly')
      
      // Clean up test data if it was created
      if (data?.id) {
        await supabaseAdmin.from('documents').delete().eq('id', data.id)
      }
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Enum type test error: ${error}`)
  }
  
  // Test 3: Check validation function
  console.log('3️⃣  Testing validation function...')
  try {
    const { data, error } = await supabaseAdmin.rpc('check_accounting_data_complete', {
      doc_id: '00000000-0000-0000-0000-000000000000'
    })
    
    if (error && !error.message.includes('no rows')) {
      tests.failed++
      tests.details.push(`❌ Validation function test failed: ${error.message}`)
    } else {
      tests.passed++
      tests.details.push('✅ check_accounting_data_complete function exists')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Validation function test error: ${error}`)
  }
  
  // Test 4: Check health endpoint
  console.log('4️⃣  Testing health endpoint...')
  try {
    const response = await fetch('http://localhost:3000/api/health')
    const health = await response.json()
    
    if (health.accounting?.schema === 'migrated' && health.accounting?.columns === 21) {
      tests.passed++
      tests.details.push('✅ Health endpoint reports accounting schema ready')
    } else {
      tests.failed++
      tests.details.push(`❌ Health endpoint issue: ${JSON.stringify(health.accounting)}`)
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Health endpoint test error: ${error}`)
  }
  
  // Test 5: Check existing documents still work
  console.log('5️⃣  Testing backward compatibility...')
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, filename, status, extracted_data')
      .limit(5)
    
    if (error) {
      tests.failed++
      tests.details.push(`❌ Backward compatibility test failed: ${error.message}`)
    } else {
      tests.passed++
      tests.details.push(`✅ Existing documents still accessible (found ${data?.length || 0} documents)`)
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Backward compatibility test error: ${error}`)
  }
  
  // Print results
  console.log('\n📊 Test Results:')
  console.log('================')
  tests.details.forEach(detail => console.log(detail))
  console.log('\n📈 Summary:')
  console.log(`✅ Passed: ${tests.passed}`)
  console.log(`❌ Failed: ${tests.failed}`)
  console.log(`📊 Total: ${tests.passed + tests.failed}`)
  
  if (tests.failed === 0) {
    console.log('\n🎉 All tests passed! Stage 18 migration is complete.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the migration.')
  }
}

// Run the tests
testMigration()