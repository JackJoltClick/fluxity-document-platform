-- Fix the search function type mismatch
DROP FUNCTION IF EXISTS search_vendors_with_aliases(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION search_vendors_with_aliases(search_query TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    tax_id TEXT,
    aliases TEXT[],
    similarity DOUBLE PRECISION
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
                SIMILARITY(v.name, search_query)::DOUBLE PRECISION,
                COALESCE(MAX(SIMILARITY(va.alias, search_query))::DOUBLE PRECISION, 0.0)
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
            SIMILARITY(v.name, search_query)::DOUBLE PRECISION,
            COALESCE(MAX(SIMILARITY(va.alias, search_query))::DOUBLE PRECISION, 0.0)
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