-- Sample Client Schemas and Test Data Migration
-- This creates example schemas for different industry types

-- Note: Replace 'your-user-id-here' with actual user IDs when running this migration
-- These are example schemas that demonstrate the flexibility of the system

-- Legal Services Schema
INSERT INTO client_schemas (
  user_id, 
  name, 
  description, 
  columns,
  is_default,
  is_active
) VALUES (
  'replace-with-user-id', -- Replace with actual user ID
  'Legal Services Schema',
  'Optimized for law firms processing invoices, billing statements, and legal documents',
  '[
    {"name": "matter_number", "description": "Client matter or case number"},
    {"name": "client_name", "description": "Name of the client or case"},
    {"name": "attorney_name", "description": "Responsible attorney or partner"},
    {"name": "practice_area", "description": "Legal practice area (litigation, corporate, etc.)"},
    {"name": "hourly_rate", "description": "Billable hourly rate"},
    {"name": "hours_billed", "description": "Number of hours billed"},
    {"name": "total_fees", "description": "Total legal fees charged"},
    {"name": "expense_type", "description": "Type of expense (filing fees, travel, etc.)"},
    {"name": "court_case_number", "description": "Court case or docket number"},
    {"name": "billing_partner", "description": "Partner responsible for billing"},
    {"name": "trust_account", "description": "Client trust account reference"},
    {"name": "retainer_amount", "description": "Retainer or advance amount"}
  ]'::jsonb,
  true,
  true
) ON CONFLICT DO NOTHING;

-- Manufacturing Schema
INSERT INTO client_schemas (
  user_id, 
  name, 
  description, 
  columns,
  is_default,
  is_active
) VALUES (
  'replace-with-user-id', -- Replace with actual user ID
  'Manufacturing Schema',
  'Designed for manufacturing companies tracking purchase orders, materials, and production costs',
  '[
    {"name": "purchase_order_number", "description": "PO number from procurement system"},
    {"name": "supplier_code", "description": "Vendor or supplier identification code"},
    {"name": "material_code", "description": "Material or part number"},
    {"name": "quantity_ordered", "description": "Quantity of materials ordered"},
    {"name": "unit_price", "description": "Price per unit of material"},
    {"name": "delivery_date", "description": "Expected or actual delivery date"},
    {"name": "production_line", "description": "Manufacturing line or department"},
    {"name": "batch_number", "description": "Production batch or lot number"},
    {"name": "quality_grade", "description": "Material quality grade or specification"},
    {"name": "warehouse_location", "description": "Storage location or bin number"},
    {"name": "project_code", "description": "Project or job order number"},
    {"name": "machinery_cost", "description": "Equipment or machinery costs"}
  ]'::jsonb,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Healthcare Schema
INSERT INTO client_schemas (
  user_id, 
  name, 
  description, 
  columns,
  is_default,
  is_active
) VALUES (
  'replace-with-user-id', -- Replace with actual user ID
  'Healthcare Schema',
  'Tailored for healthcare organizations processing medical bills, insurance claims, and supplier invoices',
  '[
    {"name": "patient_id", "description": "Patient identification number"},
    {"name": "insurance_claim_number", "description": "Insurance claim reference number"},
    {"name": "procedure_code", "description": "Medical procedure or CPT code"},
    {"name": "diagnosis_code", "description": "ICD diagnosis code"},
    {"name": "provider_npi", "description": "Healthcare provider NPI number"},
    {"name": "insurance_carrier", "description": "Insurance company name"},
    {"name": "copay_amount", "description": "Patient copayment amount"},
    {"name": "deductible_amount", "description": "Insurance deductible applied"},
    {"name": "service_date", "description": "Date of medical service"},
    {"name": "department_code", "description": "Hospital department or clinic"},
    {"name": "medical_equipment", "description": "Medical equipment or supplies"},
    {"name": "pharmaceutical_code", "description": "Medication or drug code"}
  ]'::jsonb,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Real Estate Schema
INSERT INTO client_schemas (
  user_id, 
  name, 
  description, 
  columns,
  is_default,
  is_active
) VALUES (
  'replace-with-user-id', -- Replace with actual user ID
  'Real Estate Schema',
  'Designed for real estate companies managing property transactions, commissions, and related expenses',
  '[
    {"name": "property_address", "description": "Full property address"},
    {"name": "mls_number", "description": "Multiple Listing Service number"},
    {"name": "transaction_type", "description": "Sale, lease, rental, or management"},
    {"name": "commission_rate", "description": "Commission percentage or amount"},
    {"name": "listing_agent", "description": "Primary listing agent name"},
    {"name": "selling_agent", "description": "Selling or buyer agent name"},
    {"name": "property_type", "description": "Residential, commercial, land, etc."},
    {"name": "square_footage", "description": "Property square footage"},
    {"name": "lot_size", "description": "Property lot size"},
    {"name": "closing_date", "description": "Transaction closing date"},
    {"name": "title_company", "description": "Title or escrow company"},
    {"name": "property_tax", "description": "Annual property tax amount"}
  ]'::jsonb,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Consulting Services Schema
INSERT INTO client_schemas (
  user_id, 
  name, 
  description, 
  columns,
  is_default,
  is_active
) VALUES (
  'replace-with-user-id', -- Replace with actual user ID
  'Consulting Services Schema',
  'Perfect for consulting firms tracking project billing, expenses, and client engagements',
  '[
    {"name": "project_code", "description": "Client project or engagement code"},
    {"name": "consultant_name", "description": "Lead consultant or project manager"},
    {"name": "client_contact", "description": "Primary client contact person"},
    {"name": "engagement_type", "description": "Type of consulting engagement"},
    {"name": "daily_rate", "description": "Daily consulting rate"},
    {"name": "days_worked", "description": "Number of days worked"},
    {"name": "travel_expenses", "description": "Travel and accommodation costs"},
    {"name": "milestone_number", "description": "Project milestone or phase"},
    {"name": "deliverable_type", "description": "Type of deliverable provided"},
    {"name": "contract_value", "description": "Total contract value"},
    {"name": "payment_terms", "description": "Payment terms and schedule"},
    {"name": "expense_category", "description": "Category of project expense"}
  ]'::jsonb,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Construction Schema
INSERT INTO client_schemas (
  user_id, 
  name, 
  description, 
  columns,
  is_default,
  is_active
) VALUES (
  'replace-with-user-id', -- Replace with actual user ID
  'Construction Schema',
  'Built for construction companies managing subcontractor payments, materials, and project costs',
  '[
    {"name": "job_number", "description": "Construction project or job number"},
    {"name": "subcontractor_name", "description": "Subcontractor or trade company"},
    {"name": "trade_type", "description": "Type of trade (plumbing, electrical, etc.)"},
    {"name": "material_type", "description": "Construction materials purchased"},
    {"name": "labor_hours", "description": "Labor hours worked on project"},
    {"name": "equipment_rental", "description": "Equipment rental costs"},
    {"name": "permit_number", "description": "Building permit number"},
    {"name": "phase_code", "description": "Construction phase (foundation, framing, etc.)"},
    {"name": "safety_compliance", "description": "Safety compliance certification"},
    {"name": "inspection_date", "description": "Inspection or milestone date"},
    {"name": "change_order", "description": "Change order number"},
    {"name": "completion_percentage", "description": "Percentage of work completed"}
  ]'::jsonb,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Sample Email Aliases for Testing
INSERT INTO email_aliases (user_id, email_address) VALUES
  ('replace-with-user-id', 'legal@fluxity.ai'),
  ('replace-with-user-id', 'manufacturing@fluxity.ai'),
  ('replace-with-user-id', 'healthcare@fluxity.ai'),
  ('replace-with-user-id', 'realestate@fluxity.ai'),
  ('replace-with-user-id', 'consulting@fluxity.ai'),
  ('replace-with-user-id', 'construction@fluxity.ai')
ON CONFLICT (user_id, email_address) DO NOTHING;

-- Add comments explaining the sample data
COMMENT ON TABLE client_schemas IS 'Sample schemas demonstrate flexible field extraction for different industries';

-- Instructions for using this migration:
-- 1. Replace 'replace-with-user-id' with actual user UUIDs
-- 2. Run this migration to create sample schemas
-- 3. Users can then modify these schemas or create their own
-- 4. The Legal Services Schema is set as default for demonstration