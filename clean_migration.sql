-- Add full_text column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS full_text TEXT;

-- Create GIN index for full-text search capabilities
CREATE INDEX IF NOT EXISTS idx_documents_fulltext_search 
ON documents USING gin(to_tsvector('english', full_text));

-- Add comment for documentation
COMMENT ON COLUMN documents.full_text IS 'Complete extracted text from the document for search and display purposes';

-- Create a function to search documents by text
CREATE OR REPLACE FUNCTION search_documents_by_text(
  search_query TEXT,
  user_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  relevance REAL,
  snippet TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.filename,
    ts_rank(to_tsvector('english', d.full_text), plainto_tsquery('english', search_query)) AS relevance,
    ts_headline('english', d.full_text, plainto_tsquery('english', search_query), 
                'MaxWords=50, MinWords=20, ShortWord=3, HighlightAll=false') AS snippet
  FROM documents d
  WHERE 
    to_tsvector('english', d.full_text) @@ plainto_tsquery('english', search_query)
    AND (user_id_filter IS NULL OR d.user_id = user_id_filter)
  ORDER BY relevance DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_documents_by_text TO authenticated;