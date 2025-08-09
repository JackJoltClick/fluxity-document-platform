-- Client Schemas Migration
-- Transform from hardcoded 21-column approach to flexible client-defined schemas

-- Create client_schemas table
CREATE TABLE IF NOT EXISTS client_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
    description TEXT,
    columns JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    -- Note: unique constraint for default schema per user is handled by partial index below
    CONSTRAINT valid_columns_structure CHECK (
        jsonb_typeof(columns) = 'array' AND
        jsonb_array_length(columns) >= 1 AND
        jsonb_array_length(columns) <= 50
    )
);

-- Add client_schema_id to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS client_schema_id UUID REFERENCES client_schemas(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_schemas_user_id ON client_schemas(user_id);
CREATE INDEX IF NOT EXISTS idx_client_schemas_is_active ON client_schemas(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_documents_client_schema ON documents(client_schema_id);

-- Create unique partial index to ensure only one default schema per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_schemas_unique_default 
ON client_schemas(user_id) WHERE is_default = true;

-- Enable RLS (Row Level Security)
ALTER TABLE client_schemas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_schemas
CREATE POLICY "Users can view own client schemas" ON client_schemas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client schemas" ON client_schemas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client schemas" ON client_schemas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client schemas" ON client_schemas
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_client_schemas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_schemas_updated_at_trigger
    BEFORE UPDATE ON client_schemas
    FOR EACH ROW
    EXECUTE FUNCTION update_client_schemas_updated_at();

-- Schema validation function
CREATE OR REPLACE FUNCTION validate_schema_columns(columns_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    col JSONB;
BEGIN
    -- Validate each column has required fields
    FOR col IN SELECT * FROM jsonb_array_elements(columns_json)
    LOOP
        -- Check required fields exist
        IF NOT (col ? 'name' AND col ? 'description') THEN
            RAISE EXCEPTION 'Each column must have "name" and "description" fields';
        END IF;
        
        -- Check name is not empty
        IF length(col->>'name') < 1 OR length(col->>'name') > 100 THEN
            RAISE EXCEPTION 'Column name must be between 1 and 100 characters';
        END IF;
        
        -- Check description is reasonable length
        IF length(col->>'description') > 500 THEN
            RAISE EXCEPTION 'Column description must be less than 500 characters';
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's default schema
CREATE OR REPLACE FUNCTION get_user_default_schema(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    columns JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.name,
        cs.columns
    FROM client_schemas cs
    WHERE cs.user_id = user_uuid 
    AND cs.is_default = true 
    AND cs.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent schema deletion if documents are using it
CREATE OR REPLACE FUNCTION check_schema_usage()
RETURNS TRIGGER AS $$
DECLARE
    doc_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doc_count
    FROM documents
    WHERE client_schema_id = OLD.id;
    
    IF doc_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete schema "%" - it is used by % document(s)', OLD.name, doc_count;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_schema_deletion_if_used
    BEFORE DELETE ON client_schemas
    FOR EACH ROW
    EXECUTE FUNCTION check_schema_usage();

-- Insert sample schemas for 5 different client types
-- Note: Only insert if we have at least one user in the system
INSERT INTO client_schemas (user_id, name, description, columns, is_default) 
SELECT 
    u.id as user_id,
    s.name,
    s.description, 
    s.columns,
    s.is_default
FROM auth.users u
CROSS JOIN (
    VALUES 
    ('Basic Accounting Schema', 'Standard accounting fields for general invoice processing', '[
        {"name": "Vendor Name", "description": "Name of the supplier or vendor"},
        {"name": "Invoice Number", "description": "Unique invoice identifier"},
        {"name": "Invoice Date", "description": "Date when invoice was issued"},
        {"name": "Total Amount", "description": "Final amount including taxes"},
        {"name": "Currency", "description": "Currency code (USD, EUR, etc.)"}
    ]'::jsonb, true),
    
    ('Legal Services Schema', 'Schema for law firms and legal service providers', '[
        {"name": "Law Firm", "description": "Name of the legal service provider"},
        {"name": "Matter Number", "description": "Case or matter reference number"},
        {"name": "Service Date", "description": "Date services were provided"},
        {"name": "Attorney Name", "description": "Name of responsible attorney"},
        {"name": "Service Description", "description": "Description of legal services provided"},
        {"name": "Billable Hours", "description": "Number of hours billed"},
        {"name": "Hourly Rate", "description": "Rate per hour for services"},
        {"name": "Total Fees", "description": "Total amount for legal services"}
    ]'::jsonb, false),
    
    ('Logistics & Shipping Schema', 'Schema for logistics companies and shipping providers', '[
        {"name": "Carrier Name", "description": "Name of shipping/logistics company"},
        {"name": "Tracking Number", "description": "Package or shipment tracking number"},
        {"name": "Origin", "description": "Shipping origin location"},
        {"name": "Destination", "description": "Shipping destination location"},
        {"name": "Ship Date", "description": "Date package was shipped"},
        {"name": "Delivery Date", "description": "Date package was delivered"},
        {"name": "Weight", "description": "Package weight"},
        {"name": "Shipping Cost", "description": "Cost of shipping service"},
        {"name": "Service Type", "description": "Type of shipping service (overnight, ground, etc.)"}
    ]'::jsonb, false),
    
    ('Retail Purchase Schema', 'Schema for retail and e-commerce purchases', '[
        {"name": "Store Name", "description": "Name of retail store or vendor"},
        {"name": "Receipt Number", "description": "Receipt or transaction number"},
        {"name": "Purchase Date", "description": "Date of purchase"},
        {"name": "Product Category", "description": "Category of purchased items"},
        {"name": "Product Description", "description": "Description of purchased items"},
        {"name": "Quantity", "description": "Number of items purchased"},
        {"name": "Unit Price", "description": "Price per unit"},
        {"name": "Subtotal", "description": "Subtotal before tax"},
        {"name": "Tax Amount", "description": "Sales tax amount"},
        {"name": "Total Amount", "description": "Final total amount"},
        {"name": "Payment Method", "description": "Method of payment used"}
    ]'::jsonb, false),
    
    ('Manufacturing Schema', 'Schema for manufacturing and industrial purchases', '[
        {"name": "Supplier Name", "description": "Name of parts/materials supplier"},
        {"name": "Purchase Order", "description": "PO number for the order"},
        {"name": "Part Number", "description": "Manufacturer part number"},
        {"name": "Part Description", "description": "Description of parts or materials"},
        {"name": "Quantity Ordered", "description": "Number of units ordered"},
        {"name": "Unit Cost", "description": "Cost per unit"},
        {"name": "Line Total", "description": "Total cost for this line item"},
        {"name": "Delivery Date", "description": "Expected or actual delivery date"},
        {"name": "Department Code", "description": "Department or cost center code"},
        {"name": "Project Code", "description": "Project or job number"},
        {"name": "GL Account", "description": "General ledger account code"}
    ]'::jsonb, false)
) AS s(name, description, columns, is_default)
WHERE u.id IN (SELECT id FROM auth.users LIMIT 1);

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_schema_columns(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_default_schema(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE client_schemas IS 'Client-defined document processing schemas for flexible column mapping';
COMMENT ON COLUMN client_schemas.columns IS 'JSONB array of column definitions with name and description';
COMMENT ON COLUMN client_schemas.is_default IS 'Only one default schema allowed per user';
COMMENT ON COLUMN documents.client_schema_id IS 'Links document to specific client schema for processing';

-- Migration complete message
SELECT 'Client Schemas migration completed successfully. Added flexible schema system.' AS status;