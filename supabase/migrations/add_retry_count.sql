-- Add retry_count and error_message columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update the currently stuck document to stop it from retrying
UPDATE documents 
SET status = 'permanently_failed', 
    retry_count = 999,
    error_message = 'Timeout after multiple retries'
WHERE id = '2809f417-fd64-480d-8140-44f8b1d8d95a';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_documents_status_retry 
ON documents(status, retry_count) 
WHERE status IN ('pending', 'failed');