#!/usr/bin/env node

/**
 * Script to create sample client schemas for testing and demonstration
 * Run with: node scripts/create-sample-schemas.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Sample schema definitions
const sampleSchemas = [
  {
    name: 'Legal Services Schema',
    description: 'Optimized for law firms processing invoices, billing statements, and legal documents',
    columns: [
      { name: 'matter_number', description: 'Client matter or case number' },
      { name: 'client_name', description: 'Name of the client or case' },
      { name: 'attorney_name', description: 'Responsible attorney or partner' },
      { name: 'practice_area', description: 'Legal practice area (litigation, corporate, etc.)' },
      { name: 'hourly_rate', description: 'Billable hourly rate' },
      { name: 'hours_billed', description: 'Number of hours billed' },
      { name: 'total_fees', description: 'Total legal fees charged' },
      { name: 'expense_type', description: 'Type of expense (filing fees, travel, etc.)' },
      { name: 'court_case_number', description: 'Court case or docket number' },
      { name: 'billing_partner', description: 'Partner responsible for billing' },
      { name: 'trust_account', description: 'Client trust account reference' },
      { name: 'retainer_amount', description: 'Retainer or advance amount' }
    ],
    is_default: true
  },
  {
    name: 'Manufacturing Schema',
    description: 'Designed for manufacturing companies tracking purchase orders, materials, and production costs',
    columns: [
      { name: 'purchase_order_number', description: 'PO number from procurement system' },
      { name: 'supplier_code', description: 'Vendor or supplier identification code' },
      { name: 'material_code', description: 'Material or part number' },
      { name: 'quantity_ordered', description: 'Quantity of materials ordered' },
      { name: 'unit_price', description: 'Price per unit of material' },
      { name: 'delivery_date', description: 'Expected or actual delivery date' },
      { name: 'production_line', description: 'Manufacturing line or department' },
      { name: 'batch_number', description: 'Production batch or lot number' },
      { name: 'quality_grade', description: 'Material quality grade or specification' },
      { name: 'warehouse_location', description: 'Storage location or bin number' },
      { name: 'project_code', description: 'Project or job order number' },
      { name: 'machinery_cost', description: 'Equipment or machinery costs' }
    ],
    is_default: false
  },
  {
    name: 'Healthcare Schema',
    description: 'Tailored for healthcare organizations processing medical bills, insurance claims, and supplier invoices',
    columns: [
      { name: 'patient_id', description: 'Patient identification number' },
      { name: 'insurance_claim_number', description: 'Insurance claim reference number' },
      { name: 'procedure_code', description: 'Medical procedure or CPT code' },
      { name: 'diagnosis_code', description: 'ICD diagnosis code' },
      { name: 'provider_npi', description: 'Healthcare provider NPI number' },
      { name: 'insurance_carrier', description: 'Insurance company name' },
      { name: 'copay_amount', description: 'Patient copayment amount' },
      { name: 'deductible_amount', description: 'Insurance deductible applied' },
      { name: 'service_date', description: 'Date of medical service' },
      { name: 'department_code', description: 'Hospital department or clinic' },
      { name: 'medical_equipment', description: 'Medical equipment or supplies' },
      { name: 'pharmaceutical_code', description: 'Medication or drug code' }
    ],
    is_default: false
  },
  {
    name: 'Real Estate Schema',
    description: 'Designed for real estate companies managing property transactions, commissions, and related expenses',
    columns: [
      { name: 'property_address', description: 'Full property address' },
      { name: 'mls_number', description: 'Multiple Listing Service number' },
      { name: 'transaction_type', description: 'Sale, lease, rental, or management' },
      { name: 'commission_rate', description: 'Commission percentage or amount' },
      { name: 'listing_agent', description: 'Primary listing agent name' },
      { name: 'selling_agent', description: 'Selling or buyer agent name' },
      { name: 'property_type', description: 'Residential, commercial, land, etc.' },
      { name: 'square_footage', description: 'Property square footage' },
      { name: 'lot_size', description: 'Property lot size' },
      { name: 'closing_date', description: 'Transaction closing date' },
      { name: 'title_company', description: 'Title or escrow company' },
      { name: 'property_tax', description: 'Annual property tax amount' }
    ],
    is_default: false
  },
  {
    name: 'Consulting Services Schema',
    description: 'Perfect for consulting firms tracking project billing, expenses, and client engagements',
    columns: [
      { name: 'project_code', description: 'Client project or engagement code' },
      { name: 'consultant_name', description: 'Lead consultant or project manager' },
      { name: 'client_contact', description: 'Primary client contact person' },
      { name: 'engagement_type', description: 'Type of consulting engagement' },
      { name: 'daily_rate', description: 'Daily consulting rate' },
      { name: 'days_worked', description: 'Number of days worked' },
      { name: 'travel_expenses', description: 'Travel and accommodation costs' },
      { name: 'milestone_number', description: 'Project milestone or phase' },
      { name: 'deliverable_type', description: 'Type of deliverable provided' },
      { name: 'contract_value', description: 'Total contract value' },
      { name: 'payment_terms', description: 'Payment terms and schedule' },
      { name: 'expense_category', description: 'Category of project expense' }
    ],
    is_default: false
  },
  {
    name: 'Construction Schema',
    description: 'Built for construction companies managing subcontractor payments, materials, and project costs',
    columns: [
      { name: 'job_number', description: 'Construction project or job number' },
      { name: 'subcontractor_name', description: 'Subcontractor or trade company' },
      { name: 'trade_type', description: 'Type of trade (plumbing, electrical, etc.)' },
      { name: 'material_type', description: 'Construction materials purchased' },
      { name: 'labor_hours', description: 'Labor hours worked on project' },
      { name: 'equipment_rental', description: 'Equipment rental costs' },
      { name: 'permit_number', description: 'Building permit number' },
      { name: 'phase_code', description: 'Construction phase (foundation, framing, etc.)' },
      { name: 'safety_compliance', description: 'Safety compliance certification' },
      { name: 'inspection_date', description: 'Inspection or milestone date' },
      { name: 'change_order', description: 'Change order number' },
      { name: 'completion_percentage', description: 'Percentage of work completed' }
    ],
    is_default: false
  }
]

// Sample email aliases
const sampleEmails = [
  'legal@fluxity.ai',
  'manufacturing@fluxity.ai', 
  'healthcare@fluxity.ai',
  'realestate@fluxity.ai',
  'consulting@fluxity.ai',
  'construction@fluxity.ai'
]

async function createSampleSchemas() {
  console.log('🚀 Creating sample client schemas...')

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  )

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase environment variables')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local')
    process.exit(1)
  }

  try {
    // Get the first user (for demo purposes - in production you'd specify user ID)
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found. Please create a user account first.')
      process.exit(1)
    }

    const userId = users[0].id
    console.log(`👤 Using user ID: ${userId}`)

    // Create sample schemas
    for (const schema of sampleSchemas) {
      console.log(`📋 Creating schema: ${schema.name}`)
      
      const { error } = await supabase
        .from('client_schemas')
        .insert({
          user_id: userId,
          name: schema.name,
          description: schema.description,
          columns: schema.columns,
          is_default: schema.is_default,
          is_active: true
        })

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Schema "${schema.name}" already exists, skipping...`)
        } else {
          console.error(`   ❌ Error creating schema: ${error.message}`)
        }
      } else {
        console.log(`   ✅ Created schema: ${schema.name}`)
      }
    }

    // Create sample email aliases
    console.log('\n📧 Creating sample email aliases...')
    for (const email of sampleEmails) {
      const { error } = await supabase
        .from('email_aliases')
        .insert({
          user_id: userId,
          email_address: email
        })

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Email "${email}" already exists, skipping...`)
        } else {
          console.error(`   ❌ Error creating email alias: ${error.message}`)
        }
      } else {
        console.log(`   ✅ Created email alias: ${email}`)
      }
    }

    console.log('\n🎉 Sample schemas and email aliases created successfully!')
    console.log('\nYou can now:')
    console.log('• Visit /schemas to see and edit the sample schemas')
    console.log('• Upload documents and select different schemas')
    console.log('• Send emails to the configured addresses for automatic processing')
    console.log('• Export documents to Excel with schema-specific fields')

  } catch (error) {
    console.error('❌ Failed to create sample schemas:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  createSampleSchemas()
}

module.exports = { createSampleSchemas, sampleSchemas }