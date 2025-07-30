#!/usr/bin/env npx tsx
import { supabaseAdmin } from '../src/lib/supabase/auth-server'

async function addSampleData() {
  console.log('📊 Adding sample business logic mapping data...')
  
  try {
    // Get a real user ID from the database
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    
    if (!users.users || users.users.length === 0) {
      console.log('⚠️  No users found, cannot add sample data')
      return
    }
    
    const userId = users.users[0].id
    console.log('👤 Using user ID:', userId)
    
    // Add sample company mappings
    const { error: companyError } = await supabaseAdmin
      .from('company_mappings')
      .insert([
        { user_id: userId, supplier_name: 'Office Depot', company_code: 'US01' },
        { user_id: userId, supplier_name: 'ACME Corporation', company_code: 'US01' },
        { user_id: userId, supplier_name: 'Amazon Business', company_code: 'US01' },
        { user_id: userId, supplier_name: 'Staples', company_code: 'US01' }
      ])
    
    if (companyError) {
      console.error('❌ Company mappings error:', companyError)
    } else {
      console.log('✅ Added 4 company mappings')
    }
    
    // Add sample GL mappings
    const { error: glError } = await supabaseAdmin
      .from('gl_mappings')
      .insert([
        { 
          user_id: userId, 
          keywords: ['office', 'supplies', 'stationery'], 
          gl_account: '6100', 
          description: 'Office Supplies',
          priority: 10
        },
        { 
          user_id: userId, 
          keywords: ['software', 'subscription', 'license'], 
          gl_account: '6200', 
          description: 'Software & Licenses',
          priority: 10
        },
        { 
          user_id: userId, 
          keywords: ['travel', 'hotel', 'flight'], 
          gl_account: '6300', 
          description: 'Travel Expenses',
          priority: 10
        }
      ])
    
    if (glError) {
      console.error('❌ GL mappings error:', glError)
    } else {
      console.log('✅ Added 3 GL mappings')
    }
    
    // Add sample cost center rules
    const { error: ccError } = await supabaseAdmin
      .from('cost_center_rules')
      .insert([
        { 
          user_id: userId, 
          rule_name: 'Office Supplies', 
          supplier_pattern: '(?i)office|depot|staples', 
          description_pattern: '(?i)office|supplies', 
          cost_center: 'CC-1100',
          priority: 10
        },
        { 
          user_id: userId, 
          rule_name: 'IT Expenses', 
          supplier_pattern: '(?i)amazon|software|microsoft', 
          description_pattern: '(?i)software|license|subscription', 
          cost_center: 'CC-1300',
          priority: 10
        }
      ])
    
    if (ccError) {
      console.error('❌ Cost center rules error:', ccError)
    } else {
      console.log('✅ Added 2 cost center rules')
    }
    
    console.log('🎉 Sample data added successfully!')
    
    // Test the mappings
    console.log('\n🧪 Testing mappings with sample data:')
    
    const { BusinessLogicService } = await import('../src/services/accounting/business-logic.service')
    const service = new BusinessLogicService()
    
    // Test company mapping
    const companyResult = await service.mapCompanyCode('Office Depot', userId)
    console.log(`📋 Company mapping: "Office Depot" → "${companyResult.value}" (confidence: ${companyResult.confidence})`)
    
    // Test GL mapping
    const glResult = await service.assignGLAccount('Office supplies and stationery', 150, userId)
    console.log(`📋 GL mapping: "Office supplies" → "${glResult.value}" (confidence: ${glResult.confidence})`)
    
    // Test cost center
    const ccResult = await service.determineCostCenter('Office Depot', 'Office supplies', userId)
    console.log(`📋 Cost center: "Office Depot + Office supplies" → "${ccResult.value}" (confidence: ${ccResult.confidence})`)
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error)
  }
}

// Run the script
addSampleData()