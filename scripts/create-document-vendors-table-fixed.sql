-- Create document_vendors table for vendor matching
CREATE TABLE IF NOT EXISTS document_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_vendors_document_id ON document_vendors(document_id);
CREATE INDEX IF NOT EXISTS idx_document_vendors_vendor_id ON document_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_document_vendors_confidence ON document_vendors(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_document_vendors_is_confirmed ON document_vendors(is_confirmed);

-- Create compound index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_vendors_unique ON document_vendors(document_id, vendor_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_document_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_document_vendors_updated_at ON document_vendors;
CREATE TRIGGER trigger_document_vendors_updated_at
    BEFORE UPDATE ON document_vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_document_vendors_updated_at();

-- Function to get vendor matches for a document
CREATE OR REPLACE FUNCTION get_vendor_matches_for_document(doc_id UUID)
RETURNS TABLE (
    id UUID,
    vendor_id UUID,
    vendor_name TEXT,
    vendor_tax_id TEXT,
    vendor_aliases TEXT[],
    confidence DOUBLE PRECISION,
    is_confirmed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.id,
        dv.vendor_id,
        v.name as vendor_name,
        v.tax_id as vendor_tax_id,
        ARRAY_AGG(DISTINCT va.alias) FILTER (WHERE va.alias IS NOT NULL) as vendor_aliases,
        dv.confidence,
        dv.is_confirmed,
        dv.created_at
    FROM document_vendors dv
    JOIN vendors v ON dv.vendor_id = v.id
    LEFT JOIN vendor_aliases va ON v.id = va.vendor_id
    WHERE dv.document_id = doc_id
    GROUP BY dv.id, dv.vendor_id, v.name, v.tax_id, dv.confidence, dv.is_confirmed, dv.created_at
    ORDER BY dv.confidence DESC, dv.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find potential vendor matches based on supplier name
CREATE OR REPLACE FUNCTION find_potential_vendor_matches(supplier_name TEXT, result_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    vendor_id UUID,
    vendor_name TEXT,
    vendor_tax_id TEXT,
    vendor_aliases TEXT[],
    similarity_score DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as vendor_id,
        v.name as vendor_name,
        v.tax_id as vendor_tax_id,
        COALESCE(ARRAY_AGG(DISTINCT va.alias) FILTER (WHERE va.alias IS NOT NULL), ARRAY[]::TEXT[]) as vendor_aliases,
        GREATEST(
            SIMILARITY(v.name, supplier_name)::DOUBLE PRECISION,
            COALESCE(MAX(SIMILARITY(va.alias, supplier_name))::DOUBLE PRECISION, 0.0)
        ) as similarity_score
    FROM vendors v
    LEFT JOIN vendor_aliases va ON v.id = va.vendor_id
    WHERE 
        v.name % supplier_name 
        OR EXISTS (
            SELECT 1 FROM vendor_aliases va2 
            WHERE va2.vendor_id = v.id 
            AND va2.alias % supplier_name
        )
    GROUP BY v.id, v.name, v.tax_id
    HAVING GREATEST(
        SIMILARITY(v.name, supplier_name)::DOUBLE PRECISION,
        COALESCE(MAX(SIMILARITY(va.alias, supplier_name))::DOUBLE PRECISION, 0.0)
    ) > 0.1
    ORDER BY similarity_score DESC, v.name
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;