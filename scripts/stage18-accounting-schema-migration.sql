-- Stage 18: Restructure Database for Accounting Data Model
-- This migration adds 21 accounting-specific columns to support invoice processing
-- for integration with accounting systems

-- Add accounting-specific columns to documents table
ALTER TABLE documents
-- Company and invoice identification
ADD COLUMN IF NOT EXISTS company_code TEXT,
ADD COLUMN IF NOT EXISTS supplier_invoice_transaction_type TEXT,
ADD COLUMN IF NOT EXISTS invoicing_party TEXT,
ADD COLUMN IF NOT EXISTS supplier_invoice_id_by_invcg_party TEXT,

-- Date fields
ADD COLUMN IF NOT EXISTS document_date DATE,
ADD COLUMN IF NOT EXISTS posting_date DATE,

-- Document metadata
ADD COLUMN IF NOT EXISTS accounting_document_type TEXT,
ADD COLUMN IF NOT EXISTS accounting_document_header_text TEXT,
ADD COLUMN IF NOT EXISTS document_currency TEXT,
ADD COLUMN IF NOT EXISTS invoice_gross_amount DECIMAL(15,2),

-- GL accounting fields
ADD COLUMN IF NOT EXISTS gl_account TEXT,
ADD COLUMN IF NOT EXISTS supplier_invoice_item_text TEXT,
ADD COLUMN IF NOT EXISTS debit_credit_code TEXT,
ADD COLUMN IF NOT EXISTS supplier_invoice_item_amount DECIMAL(15,2),

-- Tax information
ADD COLUMN IF NOT EXISTS tax_code TEXT,
ADD COLUMN IF NOT EXISTS tax_jurisdiction TEXT,

-- Reference and cost allocation
ADD COLUMN IF NOT EXISTS assignment_reference TEXT,
ADD COLUMN IF NOT EXISTS cost_center TEXT,
ADD COLUMN IF NOT EXISTS profit_center TEXT,
ADD COLUMN IF NOT EXISTS internal_order TEXT,
ADD COLUMN IF NOT EXISTS wbs_element TEXT;

-- Add accounting workflow columns
DO $$ 
BEGIN
  -- Create enum type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accounting_status_enum') THEN
    CREATE TYPE accounting_status_enum AS ENUM ('needs_mapping', 'ready_for_export', 'exported');
  END IF;
END $$;

-- Add accounting status columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS accounting_status accounting_status_enum DEFAULT 'needs_mapping',
ADD COLUMN IF NOT EXISTS mapping_confidence DECIMAL(3,2) CHECK (mapping_confidence >= 0 AND mapping_confidence <= 1),
ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_accounting_status ON documents(accounting_status);
CREATE INDEX IF NOT EXISTS idx_documents_company_code ON documents(company_code);
CREATE INDEX IF NOT EXISTS idx_documents_posting_date ON documents(posting_date);
CREATE INDEX IF NOT EXISTS idx_documents_requires_review ON documents(requires_review);
CREATE INDEX IF NOT EXISTS idx_documents_gl_account ON documents(gl_account);

-- Add comments to explain the columns
COMMENT ON COLUMN documents.company_code IS 'SAP company code mapped from supplier';
COMMENT ON COLUMN documents.supplier_invoice_transaction_type IS 'Transaction type for invoice processing';
COMMENT ON COLUMN documents.invoicing_party IS 'Supplier/vendor identifier';
COMMENT ON COLUMN documents.supplier_invoice_id_by_invcg_party IS 'Invoice number from supplier';
COMMENT ON COLUMN documents.document_date IS 'Invoice date from document';
COMMENT ON COLUMN documents.posting_date IS 'Date for accounting posting';
COMMENT ON COLUMN documents.accounting_document_type IS 'Type of accounting document';
COMMENT ON COLUMN documents.accounting_document_header_text IS 'Header text for accounting entry';
COMMENT ON COLUMN documents.document_currency IS 'Currency code (e.g., USD, EUR)';
COMMENT ON COLUMN documents.invoice_gross_amount IS 'Total invoice amount including tax';
COMMENT ON COLUMN documents.gl_account IS 'General ledger account code';
COMMENT ON COLUMN documents.supplier_invoice_item_text IS 'Line item description';
COMMENT ON COLUMN documents.debit_credit_code IS 'Debit/Credit indicator';
COMMENT ON COLUMN documents.supplier_invoice_item_amount IS 'Line item amount';
COMMENT ON COLUMN documents.tax_code IS 'Tax code for the transaction';
COMMENT ON COLUMN documents.tax_jurisdiction IS 'Tax jurisdiction information';
COMMENT ON COLUMN documents.assignment_reference IS 'Reference for assignment';
COMMENT ON COLUMN documents.cost_center IS 'Cost center for allocation';
COMMENT ON COLUMN documents.profit_center IS 'Profit center for allocation';
COMMENT ON COLUMN documents.internal_order IS 'Internal order number';
COMMENT ON COLUMN documents.wbs_element IS 'Work breakdown structure element';
COMMENT ON COLUMN documents.accounting_status IS 'Current status in accounting workflow';
COMMENT ON COLUMN documents.mapping_confidence IS 'Confidence score for automated mapping (0-1)';
COMMENT ON COLUMN documents.requires_review IS 'Flag for manual review requirement';

-- Create a function to validate accounting data completeness
CREATE OR REPLACE FUNCTION check_accounting_data_complete(doc_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  doc RECORD;
BEGIN
  SELECT * INTO doc FROM documents WHERE id = doc_id;
  
  -- Check if all required accounting fields are populated
  RETURN doc.company_code IS NOT NULL
    AND doc.invoicing_party IS NOT NULL
    AND doc.supplier_invoice_id_by_invcg_party IS NOT NULL
    AND doc.document_date IS NOT NULL
    AND doc.posting_date IS NOT NULL
    AND doc.document_currency IS NOT NULL
    AND doc.invoice_gross_amount IS NOT NULL
    AND doc.gl_account IS NOT NULL
    AND doc.supplier_invoice_item_amount IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update accounting status based on data completeness
CREATE OR REPLACE FUNCTION update_accounting_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If all required fields are populated and confidence is high
  IF check_accounting_data_complete(NEW.id) 
     AND NEW.mapping_confidence >= 0.8 
     AND NOT NEW.requires_review THEN
    NEW.accounting_status = 'ready_for_export';
  -- If data is complete but needs review
  ELSIF check_accounting_data_complete(NEW.id) AND NEW.requires_review THEN
    NEW.accounting_status = 'needs_mapping';
  -- If data is incomplete
  ELSE
    NEW.accounting_status = 'needs_mapping';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update accounting status
CREATE TRIGGER update_accounting_status_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_status();

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION check_accounting_data_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_accounting_status() TO authenticated;

-- Migration complete
SELECT 'Stage 18: Accounting schema migration completed successfully. Added 21 accounting columns.' AS status;