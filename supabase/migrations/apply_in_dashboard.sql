-- Run this SQL in your Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/pgrnpspobiiwqyjlixoi/sql/new

-- Add new columns to documents table for multi-model extraction
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS extraction_models text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS model_confidences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS validation_errors jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS requires_review boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS review_notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS extraction_consensus jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preprocessing_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS preprocessing_improvements text[] DEFAULT '{}';

-- Add columns for individual model results
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS textract_result jsonb,
ADD COLUMN IF NOT EXISTS openai_result jsonb,
ADD COLUMN IF NOT EXISTS claude_result jsonb;

-- Add extraction confidence columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS textract_confidence numeric(3,2),
ADD COLUMN IF NOT EXISTS openai_confidence numeric(3,2),
ADD COLUMN IF NOT EXISTS claude_confidence numeric(3,2),
ADD COLUMN IF NOT EXISTS overall_confidence numeric(3,2);

-- Create index for filtering documents that need review
CREATE INDEX IF NOT EXISTS idx_documents_requires_review 
ON documents(requires_review, status) 
WHERE requires_review = true;

-- Create index for filtering by confidence levels
CREATE INDEX IF NOT EXISTS idx_documents_confidence 
ON documents(overall_confidence) 
WHERE overall_confidence IS NOT NULL;

-- Create index for filtering by extraction models used
CREATE INDEX IF NOT EXISTS idx_documents_extraction_models 
ON documents USING GIN(extraction_models);

-- Test if columns were created successfully
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name IN (
    'requires_review', 
    'overall_confidence', 
    'validation_errors',
    'extraction_models'
  );