-- Migration: Add Hybrid Extraction Support
-- This adds columns to track Textract + OpenAI hybrid extraction results

-- Add new columns to documents table for hybrid extraction
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS textract_confidence DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS openai_confidence DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cross_validation_score DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS textract_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cross_validation_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS extraction_costs JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_extraction_confidence ON documents(extraction_confidence);
CREATE INDEX IF NOT EXISTS idx_documents_extraction_method ON documents(extraction_method);
CREATE INDEX IF NOT EXISTS idx_documents_cross_validation_score ON documents(cross_validation_score);

-- Update extraction_method enum if needed (PostgreSQL doesn't have built-in enums in this schema)
-- Documents with hybrid extraction will have extraction_method = 'hybrid-textract-openai'

-- Add comments for documentation
COMMENT ON COLUMN documents.extraction_confidence IS 'Overall confidence score from hybrid extraction (0.0 to 1.0)';
COMMENT ON COLUMN documents.textract_confidence IS 'Textract service confidence score (0.0 to 1.0)';
COMMENT ON COLUMN documents.openai_confidence IS 'OpenAI service confidence score (0.0 to 1.0)';
COMMENT ON COLUMN documents.cross_validation_score IS 'Agreement score between Textract and OpenAI (0.0 to 1.0)';
COMMENT ON COLUMN documents.textract_data IS 'Raw structured data from Textract (tables, key-value pairs, line items)';
COMMENT ON COLUMN documents.cross_validation_data IS 'Cross-validation results and conflicting fields';
COMMENT ON COLUMN documents.extraction_costs IS 'Cost breakdown: {"textract": 0.065, "openai": 0.02, "total": 0.085}';

-- Create a view for high-confidence documents
CREATE OR REPLACE VIEW high_confidence_documents AS
SELECT 
    id,
    filename,
    extraction_method,
    extraction_confidence,
    cross_validation_score,
    status,
    created_at,
    CASE 
        WHEN extraction_confidence >= 0.95 THEN 'Excellent'
        WHEN extraction_confidence >= 0.90 THEN 'Very Good'
        WHEN extraction_confidence >= 0.80 THEN 'Good'
        WHEN extraction_confidence >= 0.70 THEN 'Fair'
        ELSE 'Needs Review'
    END as confidence_rating
FROM documents 
WHERE status = 'completed'
ORDER BY extraction_confidence DESC;

-- Create a view for extraction cost analysis
CREATE OR REPLACE VIEW extraction_cost_analysis AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    extraction_method,
    COUNT(*) as document_count,
    AVG(extraction_confidence) as avg_confidence,
    SUM((extraction_costs->>'total')::DECIMAL) as total_cost,
    AVG((extraction_costs->>'total')::DECIMAL) as avg_cost_per_doc
FROM documents 
WHERE status = 'completed' 
AND extraction_costs IS NOT NULL
GROUP BY DATE_TRUNC('day', created_at), extraction_method
ORDER BY date DESC;

-- Function to get extraction statistics
CREATE OR REPLACE FUNCTION get_extraction_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_documents BIGINT,
    avg_confidence DECIMAL,
    hybrid_documents BIGINT,
    high_confidence_documents BIGINT,
    total_extraction_cost DECIMAL,
    avg_processing_time DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_documents,
        ROUND(AVG(extraction_confidence), 3)::DECIMAL as avg_confidence,
        COUNT(*) FILTER (WHERE extraction_method = 'hybrid-textract-openai')::BIGINT as hybrid_documents,
        COUNT(*) FILTER (WHERE extraction_confidence >= 0.90)::BIGINT as high_confidence_documents,
        ROUND(SUM((extraction_costs->>'total')::DECIMAL), 2)::DECIMAL as total_extraction_cost,
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))), 2)::DECIMAL as avg_processing_time
    FROM documents 
    WHERE created_at >= start_date 
    AND created_at <= end_date + INTERVAL '1 day'
    AND status = 'completed';
END;
$$;

-- Grant permissions
GRANT SELECT ON high_confidence_documents TO authenticated;
GRANT SELECT ON extraction_cost_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_extraction_stats TO authenticated;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Hybrid Extraction Migration Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'New Features Added:';
    RAISE NOTICE '• Confidence tracking (extraction_confidence, textract_confidence, openai_confidence)';
    RAISE NOTICE '• Cross-validation scoring (cross_validation_score)';
    RAISE NOTICE '• Structured Textract data storage (textract_data)';
    RAISE NOTICE '• Cost tracking (extraction_costs)';
    RAISE NOTICE '• High-confidence documents view';
    RAISE NOTICE '• Extraction cost analysis view';
    RAISE NOTICE '• Statistics function: get_extraction_stats()';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Deploy Lambda with hybrid extraction code!';
    RAISE NOTICE '';
END;
$$;