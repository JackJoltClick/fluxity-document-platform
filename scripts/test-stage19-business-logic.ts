#!/usr/bin/env npx tsx
import { supabaseAdmin } from '../src/lib/supabase/auth-server'
import { BusinessLogicService } from '../src/services/accounting/business-logic.service'
import { ExtractedData } from '../src/types/document.types'

async function testBusinessLogic() {
  console.log('🧪 Testing Stage 19: Business Logic Mapping Service...\n')
  
  const tests = {
    passed: 0,
    failed: 0,
    details: [] as string[]
  }
  
  // Test 1: Check if business logic tables exist
  console.log('1️⃣  Testing business logic tables...')
  try {
    const tables = ['company_mappings', 'gl_mappings', 'cost_center_rules', 'business_logic_audit']
    let allTablesExist = true
    
    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .select('id')
        .limit(1)
      
      if (error && !error.message.includes('no rows')) {
        console.log(`❌ Table ${table} does not exist:`, error.message)
        allTablesExist = false
      }
    }
    
    if (allTablesExist) {
      tests.passed++
      tests.details.push('✅ All business logic tables exist')
    } else {
      tests.failed++
      tests.details.push('❌ Some business logic tables are missing')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Business logic tables test error: ${error}`)
  }
  
  // Test 2: Test service instantiation
  console.log('2️⃣  Testing service instantiation...')
  try {
    const service = new BusinessLogicService()
    const healthCheck = await service.testConnection()
    
    if (healthCheck.service === 'active') {
      tests.passed++
      tests.details.push('✅ Business logic service instantiated successfully')
    } else {
      tests.failed++
      tests.details.push(`❌ Service health check failed: ${JSON.stringify(healthCheck)}`)
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Service instantiation error: ${error}`)
  }
  
  // Test 3: Test company code mapping with sample data
  console.log('3️⃣  Testing company code mapping...')
  try {
    const service = new BusinessLogicService()
    
    // Create a test user ID (use a placeholder UUID)
    const testUserId = '00000000-0000-0000-0000-000000000000'
    
    // Test with a supplier name
    const result = await service.mapCompanyCode('ACME Corporation', testUserId)
    
    if (result && typeof result === 'object' && 'value' in result && 'confidence' in result) {
      tests.passed++
      tests.details.push(`✅ Company code mapping works (confidence: ${result.confidence})`)
    } else {
      tests.failed++
      tests.details.push('❌ Company code mapping returned invalid result')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Company code mapping error: ${error}`)
  }
  
  // Test 4: Test GL account assignment
  console.log('4️⃣  Testing GL account assignment...')
  try {
    const service = new BusinessLogicService()
    const testUserId = '00000000-0000-0000-0000-000000000000'
    
    const result = await service.assignGLAccount('Office supplies and equipment', 250.00, testUserId)
    
    if (result && typeof result === 'object' && 'value' in result && 'confidence' in result) {
      tests.passed++
      tests.details.push(`✅ GL account assignment works (GL: ${result.value}, confidence: ${result.confidence})`)
    } else {
      tests.failed++
      tests.details.push('❌ GL account assignment returned invalid result')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ GL account assignment error: ${error}`)
  }
  
  // Test 5: Test cost center determination
  console.log('5️⃣  Testing cost center determination...')
  try {
    const service = new BusinessLogicService()
    const testUserId = '00000000-0000-0000-0000-000000000000'
    
    const result = await service.determineCostCenter('Office Depot', 'Office supplies', testUserId)
    
    if (result && typeof result === 'object' && 'value' in result && 'confidence' in result) {
      tests.passed++
      tests.details.push(`✅ Cost center determination works (CC: ${result.value}, confidence: ${result.confidence})`)
    } else {
      tests.failed++
      tests.details.push('❌ Cost center determination returned invalid result')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Cost center determination error: ${error}`)
  }
  
  // Test 6: Test transaction type mapping
  console.log('6️⃣  Testing transaction type mapping...')
  try {
    const service = new BusinessLogicService()
    
    const result = service.setTransactionType('invoice')
    
    if (result && typeof result === 'object' && 'value' in result && 'confidence' in result) {
      tests.passed++
      tests.details.push(`✅ Transaction type mapping works (Type: ${result.value}, confidence: ${result.confidence})`)
    } else {
      tests.failed++
      tests.details.push('❌ Transaction type mapping returned invalid result')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Transaction type mapping error: ${error}`)
  }
  
  // Test 7: Test complete document processing
  console.log('7️⃣  Testing complete document processing...')
  try {
    const service = new BusinessLogicService()
    const testUserId = '00000000-0000-0000-0000-000000000000'
    
    // Sample extracted data
    const extractedData: ExtractedData = {
      supplier_name: { value: 'Office Depot', confidence: 0.9 },
      invoice_number: { value: 'INV-2025-001', confidence: 0.95 },
      invoice_date: { value: '2025-01-15', confidence: 0.9 },
      total_amount: { value: 245.50, confidence: 0.95 },
      line_items: [
        { value: 'Office supplies - pens, paper, folders', confidence: 0.8 }
      ],
      extraction_method: 'openai',
      total_cost: 0.05
    }
    
    const result = await service.processDocument(extractedData, testUserId)
    
    if (result && typeof result === 'object' && 'overall_confidence' in result) {
      tests.passed++
      tests.details.push(`✅ Complete document processing works (Overall confidence: ${Math.round(result.overall_confidence * 100)}%)`)
      
      // Check that all 21 accounting fields are present
      const accountingFields = [
        'company_code', 'supplier_invoice_transaction_type', 'invoicing_party',
        'supplier_invoice_id_by_invcg_party', 'document_date', 'posting_date',
        'accounting_document_type', 'accounting_document_header_text', 'document_currency',
        'invoice_gross_amount', 'gl_account', 'supplier_invoice_item_text',
        'debit_credit_code', 'supplier_invoice_item_amount', 'tax_code',
        'tax_jurisdiction', 'assignment_reference', 'cost_center',
        'profit_center', 'internal_order', 'wbs_element'
      ]
      
      const missingFields = accountingFields.filter(field => !(field in result))
      
      if (missingFields.length === 0) {
        tests.passed++
        tests.details.push('✅ All 21 accounting fields populated')
      } else {
        tests.failed++
        tests.details.push(`❌ Missing accounting fields: ${missingFields.join(', ')}`)
      }
    } else {
      tests.failed++
      tests.details.push('❌ Complete document processing returned invalid result')
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Complete document processing error: ${error}`)
  }
  
  // Test 8: Test health endpoint
  console.log('8️⃣  Testing health endpoint...')
  try {
    const response = await fetch('http://localhost:3000/api/health')
    const health = await response.json()
    
    if (health.business_logic?.service === 'active') {
      tests.passed++
      tests.details.push('✅ Health endpoint reports business logic active')
    } else {
      tests.failed++
      tests.details.push(`❌ Health endpoint issue: ${JSON.stringify(health.business_logic)}`)
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Health endpoint test error: ${error}`)
  }
  
  // Test 9: Test database functions
  console.log('9️⃣  Testing database functions...')
  try {
    // Test similarity function
    const { data: similarityData, error: similarityError } = await supabaseAdmin.rpc('calculate_similarity', {
      text1: 'ACME Corporation',
      text2: 'ACME Corp'
    })
    
    if (!similarityError && typeof similarityData === 'number') {
      tests.passed++
      tests.details.push(`✅ Database similarity function works (similarity: ${similarityData})`)
    } else {
      tests.failed++
      tests.details.push(`❌ Database similarity function failed: ${similarityError?.message}`)
    }
  } catch (error) {
    tests.failed++
    tests.details.push(`❌ Database functions test error: ${error}`)
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
    console.log('\n🎉 All tests passed! Stage 19 business logic is ready.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.')
  }
  
  // Create sample mappings for testing if needed
  if (tests.passed > tests.failed) {
    console.log('\n💡 To test with actual mappings, add some sample data:')
    console.log('   - Company mappings: supplier names → company codes')
    console.log('   - GL mappings: keywords → GL accounts')
    console.log('   - Cost center rules: patterns → cost centers')
  }
}

// Run the tests
testBusinessLogic().catch(console.error)