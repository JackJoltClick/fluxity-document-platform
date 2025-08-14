-- Create ERP master data table for storing valid options from client ERPs
CREATE TABLE IF NOT EXISTS erp_master_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'company_code',
    'transaction_type', 
    'vendor',
    'document_type',
    'gl_account',
    'debit_credit',
    'tax_code',
    'tax_jurisdiction',
    'assignment',
    'cost_center',
    'profit_center',
    'order_number',
    'wbs_element'
  )),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique codes per client and type
  UNIQUE(client_id, data_type, code)
);

-- Create indexes for fast lookups
CREATE INDEX idx_erp_master_data_client_type ON erp_master_data(client_id, data_type);
CREATE INDEX idx_erp_master_data_active ON erp_master_data(is_active) WHERE is_active = true;
CREATE INDEX idx_erp_master_data_code ON erp_master_data(code);

-- Create field validation results table
CREATE TABLE IF NOT EXISTS field_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  extracted_value TEXT,
  matched_code TEXT,
  matched_name TEXT,
  confidence DECIMAL(3,2),
  validation_status TEXT CHECK (validation_status IN ('exact', 'fuzzy_high', 'fuzzy_medium', 'fuzzy_low', 'no_match')),
  alternative_matches JSONB DEFAULT '[]',
  user_selected_code TEXT,
  user_selected_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for document lookups
CREATE INDEX idx_field_validations_document ON field_validations(document_id);

-- Insert test data for development
INSERT INTO erp_master_data (client_id, data_type, code, name, description) VALUES
-- Test client vendors
('00000000-0000-0000-0000-000000000000', 'vendor', 'AMZN0001', 'Amazon Web Services Inc', 'Cloud services provider'),
('00000000-0000-0000-0000-000000000000', 'vendor', 'GOOGL001', 'Google Cloud Platform', 'Cloud and software services'),
('00000000-0000-0000-0000-000000000000', 'vendor', 'MSFT0001', 'Microsoft Corporation', 'Software and cloud services'),
('00000000-0000-0000-0000-000000000000', 'vendor', 'JACK0001', 'Jack''s Foods Inc', 'Food supplier'),
('00000000-0000-0000-0000-000000000000', 'vendor', 'STAPL001', 'Staples Office Supplies', 'Office supplies vendor'),
('00000000-0000-0000-0000-000000000000', 'vendor', 'FEDEX001', 'FedEx Corporation', 'Shipping and logistics'),
('00000000-0000-0000-0000-000000000000', 'vendor', 'UPS00001', 'United Parcel Service', 'Shipping and logistics'),
('00000000-0000-0000-0000-000000000000', 'vendor', 'ADOBE001', 'Adobe Systems Inc', 'Creative software'),

-- Test client GL accounts
('00000000-0000-0000-0000-000000000000', 'gl_account', '6200000001', 'Cloud Services', 'IT cloud infrastructure'),
('00000000-0000-0000-0000-000000000000', 'gl_account', '6300000001', 'Software Licenses', 'Software subscriptions'),
('00000000-0000-0000-0000-000000000000', 'gl_account', '5200000001', 'Office Supplies', 'General office supplies'),
('00000000-0000-0000-0000-000000000000', 'gl_account', '7100000001', 'Travel & Entertainment', 'T&E expenses'),
('00000000-0000-0000-0000-000000000000', 'gl_account', '7200000001', 'Professional Services', 'Consulting and services'),

-- Test client cost centers
('00000000-0000-0000-0000-000000000000', 'cost_center', 'TECH000001', 'Technology Department', 'IT and engineering'),
('00000000-0000-0000-0000-000000000000', 'cost_center', 'MRKT000001', 'Marketing Department', 'Marketing and advertising'),
('00000000-0000-0000-0000-000000000000', 'cost_center', 'OPS0000001', 'Operations', 'Business operations'),
('00000000-0000-0000-0000-000000000000', 'cost_center', 'FIN0000001', 'Finance', 'Finance and accounting'),
('00000000-0000-0000-0000-000000000000', 'cost_center', 'HR00000001', 'Human Resources', 'People operations'),

-- Company codes
('00000000-0000-0000-0000-000000000000', 'company_code', '1000', 'US Operations', 'United States entity'),
('00000000-0000-0000-0000-000000000000', 'company_code', '2000', 'EU Operations', 'European entity'),
('00000000-0000-0000-0000-000000000000', 'company_code', '3000', 'APAC Operations', 'Asia Pacific entity'),

-- Document types
('00000000-0000-0000-0000-000000000000', 'document_type', 'RE', 'Vendor Invoice', 'Standard vendor invoice'),
('00000000-0000-0000-0000-000000000000', 'document_type', 'KR', 'Vendor Credit', 'Credit memo from vendor'),
('00000000-0000-0000-0000-000000000000', 'document_type', 'KG', 'Vendor Payment', 'Payment to vendor'),

-- Tax codes
('00000000-0000-0000-0000-000000000000', 'tax_code', 'V0', 'Standard Rate VAT', '20% VAT'),
('00000000-0000-0000-0000-000000000000', 'tax_code', 'V1', 'Reduced Rate VAT', '5% VAT'),
('00000000-0000-0000-0000-000000000000', 'tax_code', 'E0', 'Exempt', 'Tax exempt'),

-- Transaction types
('00000000-0000-0000-0000-000000000000', 'transaction_type', '1', 'Invoice', 'Standard invoice'),
('00000000-0000-0000-0000-000000000000', 'transaction_type', '2', 'Credit Memo', 'Credit note'),

-- Debit/Credit codes
('00000000-0000-0000-0000-000000000000', 'debit_credit', 'S', 'Debit', 'Debit entry'),
('00000000-0000-0000-0000-000000000000', 'debit_credit', 'H', 'Credit', 'Credit entry');

-- RLS Policies
ALTER TABLE erp_master_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_validations ENABLE ROW LEVEL SECURITY;

-- Policy for reading master data (users can read their client's data)
CREATE POLICY "Users can read their client's ERP master data"
  ON erp_master_data FOR SELECT
  USING (true); -- For now, allow all reads. In production, check client association

-- Policy for field validations
CREATE POLICY "Users can read validations for their documents"
  ON field_validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = field_validations.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update validations for their documents"
  ON field_validations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = field_validations.document_id
      AND documents.user_id = auth.uid()
    )
  );