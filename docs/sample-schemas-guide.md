# Sample Client Schemas Guide

This guide explains the sample client schemas provided with Fluxity to demonstrate the flexibility of the dynamic schema system.

## 🚀 Quick Start

### Option 1: Run the Creation Script
```bash
node scripts/create-sample-schemas.js
```

### Option 2: Manual Creation via UI
1. Go to `/schemas` in your dashboard
2. Click "Create New Schema"  
3. Use the examples below as templates

## 📋 Available Sample Schemas

### 1. **Legal Services Schema** 
*Perfect for law firms and legal departments*

**Fields:**
- `matter_number` - Client matter or case number
- `client_name` - Name of the client or case
- `attorney_name` - Responsible attorney or partner
- `practice_area` - Legal practice area (litigation, corporate, etc.)
- `hourly_rate` - Billable hourly rate
- `hours_billed` - Number of hours billed
- `total_fees` - Total legal fees charged
- `expense_type` - Type of expense (filing fees, travel, etc.)
- `court_case_number` - Court case or docket number
- `billing_partner` - Partner responsible for billing
- `trust_account` - Client trust account reference
- `retainer_amount` - Retainer or advance amount

**Use Case:** Process legal invoices, billing statements, and client communications with law-specific field extraction.

---

### 2. **Manufacturing Schema**
*Designed for manufacturing and production companies*

**Fields:**
- `purchase_order_number` - PO number from procurement system
- `supplier_code` - Vendor or supplier identification code
- `material_code` - Material or part number
- `quantity_ordered` - Quantity of materials ordered
- `unit_price` - Price per unit of material
- `delivery_date` - Expected or actual delivery date
- `production_line` - Manufacturing line or department
- `batch_number` - Production batch or lot number
- `quality_grade` - Material quality grade or specification
- `warehouse_location` - Storage location or bin number
- `project_code` - Project or job order number
- `machinery_cost` - Equipment or machinery costs

**Use Case:** Track purchase orders, material receipts, and production-related invoices.

---

### 3. **Healthcare Schema**
*Tailored for healthcare organizations*

**Fields:**
- `patient_id` - Patient identification number
- `insurance_claim_number` - Insurance claim reference number
- `procedure_code` - Medical procedure or CPT code
- `diagnosis_code` - ICD diagnosis code
- `provider_npi` - Healthcare provider NPI number
- `insurance_carrier` - Insurance company name
- `copay_amount` - Patient copayment amount
- `deductible_amount` - Insurance deductible applied
- `service_date` - Date of medical service
- `department_code` - Hospital department or clinic
- `medical_equipment` - Medical equipment or supplies
- `pharmaceutical_code` - Medication or drug code

**Use Case:** Process medical bills, insurance claims, and healthcare supplier invoices.

---

### 4. **Real Estate Schema**
*For real estate and property management companies*

**Fields:**
- `property_address` - Full property address
- `mls_number` - Multiple Listing Service number
- `transaction_type` - Sale, lease, rental, or management
- `commission_rate` - Commission percentage or amount
- `listing_agent` - Primary listing agent name
- `selling_agent` - Selling or buyer agent name
- `property_type` - Residential, commercial, land, etc.
- `square_footage` - Property square footage
- `lot_size` - Property lot size
- `closing_date` - Transaction closing date
- `title_company` - Title or escrow company
- `property_tax` - Annual property tax amount

**Use Case:** Manage property transactions, commission statements, and real estate related expenses.

---

### 5. **Consulting Services Schema**
*Perfect for consulting and professional services firms*

**Fields:**
- `project_code` - Client project or engagement code
- `consultant_name` - Lead consultant or project manager
- `client_contact` - Primary client contact person
- `engagement_type` - Type of consulting engagement
- `daily_rate` - Daily consulting rate
- `days_worked` - Number of days worked
- `travel_expenses` - Travel and accommodation costs
- `milestone_number` - Project milestone or phase
- `deliverable_type` - Type of deliverable provided
- `contract_value` - Total contract value
- `payment_terms` - Payment terms and schedule
- `expense_category` - Category of project expense

**Use Case:** Track project billing, consultant timesheets, and engagement-related expenses.

---

### 6. **Construction Schema**
*Built for construction and contracting companies*

**Fields:**
- `job_number` - Construction project or job number
- `subcontractor_name` - Subcontractor or trade company
- `trade_type` - Type of trade (plumbing, electrical, etc.)
- `material_type` - Construction materials purchased
- `labor_hours` - Labor hours worked on project
- `equipment_rental` - Equipment rental costs
- `permit_number` - Building permit number
- `phase_code` - Construction phase (foundation, framing, etc.)
- `safety_compliance` - Safety compliance certification
- `inspection_date` - Inspection or milestone date
- `change_order` - Change order number
- `completion_percentage` - Percentage of work completed

**Use Case:** Manage subcontractor payments, material purchases, and construction project costs.

## 📧 Sample Email Configuration

The script also creates sample email aliases:
- `legal@fluxity.ai`
- `manufacturing@fluxity.ai`
- `healthcare@fluxity.ai`
- `realestate@fluxity.ai`
- `consulting@fluxity.ai`
- `construction@fluxity.ai`

These demonstrate how different email addresses can route to the same user account but be processed with different schemas.

## 🛠️ Customization

### Modify Existing Schemas
1. Go to `/schemas` in your dashboard
2. Click "Edit" on any sample schema
3. Add, remove, or modify fields as needed
4. Save your changes

### Create Your Own Schema
1. Use the sample schemas as inspiration
2. Create fields that match your business processes
3. Set appropriate field descriptions for better AI extraction
4. Mark one schema as "Default" for email processing

### Best Practices for Schema Fields

**Good Field Names:**
- `invoice_number` (specific and clear)
- `project_code` (business-relevant)
- `hourly_rate` (precise)

**Good Descriptions:**
- "Unique invoice identifier from vendor system"
- "Internal project tracking code"
- "Billable rate per hour in USD"

**Avoid:**
- Generic names like `field1`, `data`, `info`
- Vague descriptions like "some number" or "text field"

## 🔄 Migration from Legacy System

If you're currently using the 21-field accounting system:

1. **Analyze your current fields** - Which ones do you actually use?
2. **Create a custom schema** with only the fields you need
3. **Add industry-specific fields** that the legacy system didn't support
4. **Test with sample documents** before switching completely
5. **Set as default** when you're ready to switch

## 📊 Excel Export Benefits

With custom schemas, your Excel exports will contain:
- **Only relevant fields** for your industry
- **Proper field names** that match your business terminology
- **Organized data** that makes sense for your workflows
- **No empty columns** from unused legacy fields

## 🎯 Testing Your Schemas

1. **Upload test documents** with different schemas selected
2. **Check field extraction accuracy** - are the right values being found?
3. **Export to Excel** - does the data look correct?
4. **Send test emails** - do they route to the right schema?
5. **Refine field descriptions** based on AI extraction results

## 💡 Tips for Success

- **Start simple** - begin with 6-8 core fields, add more later
- **Use business language** - field names should match your terminology  
- **Provide context** - good descriptions help AI understand what to extract
- **Test iteratively** - try different documents and refine your schema
- **One schema per workflow** - don't try to make one schema do everything

## 🆘 Support

If you need help with your schemas:
1. Check the field extraction results in document details
2. Review the AI confidence scores for each field
3. Adjust field descriptions to be more specific
4. Contact support with examples of documents that aren't extracting correctly