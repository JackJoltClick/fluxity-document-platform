-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vendor_aliases table
CREATE TABLE IF NOT EXISTS vendor_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(vendor_id, alias)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_tax_id ON vendors(tax_id);
CREATE INDEX IF NOT EXISTS idx_vendor_aliases_vendor_id ON vendor_aliases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_aliases_alias ON vendor_aliases(alias);

-- Enable PostgreSQL trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_vendors_name_trgm ON vendors USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendor_aliases_alias_trgm ON vendor_aliases USING gin(alias gin_trgm_ops);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for fuzzy search across vendors and aliases
CREATE OR REPLACE FUNCTION search_vendors_with_aliases(search_query TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    tax_id TEXT,
    aliases TEXT[],
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH vendor_matches AS (
        SELECT 
            v.id,
            v.name,
            v.tax_id,
            ARRAY_AGG(DISTINCT va.alias) FILTER (WHERE va.alias IS NOT NULL) as aliases,
            GREATEST(
                SIMILARITY(v.name, search_query),
                COALESCE(MAX(SIMILARITY(va.alias, search_query)), 0)
            ) as sim_score
        FROM vendors v
        LEFT JOIN vendor_aliases va ON v.id = va.vendor_id
        WHERE 
            v.name % search_query 
            OR EXISTS (
                SELECT 1 FROM vendor_aliases va2 
                WHERE va2.vendor_id = v.id 
                AND va2.alias % search_query
            )
        GROUP BY v.id, v.name, v.tax_id
        HAVING GREATEST(
            SIMILARITY(v.name, search_query),
            COALESCE(MAX(SIMILARITY(va.alias, search_query)), 0)
        ) > 0.1
    )
    SELECT 
        vm.id,
        vm.name,
        vm.tax_id,
        COALESCE(vm.aliases, ARRAY[]::TEXT[]) as aliases,
        vm.sim_score as similarity
    FROM vendor_matches vm
    ORDER BY vm.sim_score DESC, vm.name
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Add some sample data
INSERT INTO vendors (name, tax_id) VALUES 
    ('CPB SOFTWARE (GERMANY) GMBH', 'DE123456789'),
    ('Jack''s Fast Foods', 'US987654321'),
    ('Acme Corporation', 'US123456789')
ON CONFLICT DO NOTHING;

INSERT INTO vendor_aliases (vendor_id, alias) VALUES 
    ((SELECT id FROM vendors WHERE name = 'CPB SOFTWARE (GERMANY) GMBH'), 'CPB Software'),
    ((SELECT id FROM vendors WHERE name = 'CPB SOFTWARE (GERMANY) GMBH'), 'CPB GMBH'),
    ((SELECT id FROM vendors WHERE name = 'Jack''s Fast Foods'), 'Jacks Fast Food'),
    ((SELECT id FROM vendors WHERE name = 'Jack''s Fast Foods'), 'Jack Fast Foods')
ON CONFLICT DO NOTHING;