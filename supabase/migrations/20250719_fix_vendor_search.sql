-- Fix vendor search function to include ILIKE fallback for better matching
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
            COALESCE(MAX(SIMILARITY(va.alias, supplier_name))::DOUBLE PRECISION, 0.0),
            -- Add bonus for ILIKE matches
            CASE WHEN v.name ILIKE '%' || supplier_name || '%' THEN 0.5 ELSE 0.0 END,
            CASE WHEN EXISTS(SELECT 1 FROM vendor_aliases va2 WHERE va2.vendor_id = v.id AND va2.alias ILIKE '%' || supplier_name || '%') THEN 0.5 ELSE 0.0 END
        ) as similarity_score
    FROM vendors v
    LEFT JOIN vendor_aliases va ON v.id = va.vendor_id
    WHERE 
        v.name % supplier_name 
        OR v.name ILIKE '%' || supplier_name || '%'
        OR EXISTS (
            SELECT 1 FROM vendor_aliases va2 
            WHERE va2.vendor_id = v.id 
            AND (va2.alias % supplier_name OR va2.alias ILIKE '%' || supplier_name || '%')
        )
    GROUP BY v.id, v.name, v.tax_id
    HAVING GREATEST(
        SIMILARITY(v.name, supplier_name)::DOUBLE PRECISION,
        COALESCE(MAX(SIMILARITY(va.alias, supplier_name))::DOUBLE PRECISION, 0.0),
        CASE WHEN v.name ILIKE '%' || supplier_name || '%' THEN 0.5 ELSE 0.0 END,
        CASE WHEN EXISTS(SELECT 1 FROM vendor_aliases va2 WHERE va2.vendor_id = v.id AND va2.alias ILIKE '%' || supplier_name || '%') THEN 0.5 ELSE 0.0 END
    ) > 0.1
    ORDER BY similarity_score DESC, v.name
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;