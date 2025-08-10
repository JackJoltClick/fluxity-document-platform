-- Migration: Add multi-model extraction support to documents table
-- Date: 2025-01-11
-- Description: Add columns for tracking model-specific confidence scores,
--              validation errors, and extraction metadata

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

-- Add columns for individual model results (for debugging and comparison)
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

-- Create a view for documents needing review
CREATE OR REPLACE VIEW documents_needing_review AS
SELECT 
  d.id,
  d.filename,
  d.created_at,
  d.overall_confidence,
  d.extraction_models,
  d.validation_errors,
  d.status,
  d.user_id,
  u.email as user_email
FROM documents d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE d.requires_review = true
  AND d.reviewed_at IS NULL
  AND d.status = 'completed'
ORDER BY d.created_at DESC;

-- Create a function to calculate field-level consensus
CREATE OR REPLACE FUNCTION calculate_field_consensus(
  textract_value text,
  openai_value text,
  claude_value text
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
  agreement_count integer := 0;
  consensus_value text;
BEGIN
  -- Count agreements
  IF textract_value = openai_value THEN
    agreement_count := agreement_count + 1;
  END IF;
  
  IF textract_value = claude_value THEN
    agreement_count := agreement_count + 1;
  END IF;
  
  IF openai_value = claude_value THEN
    agreement_count := agreement_count + 1;
  END IF;
  
  -- Determine consensus
  IF textract_value = openai_value AND textract_value = claude_value THEN
    -- Unanimous agreement
    consensus_value := textract_value;
    result := jsonb_build_object(
      'value', consensus_value,
      'agreement', 'unanimous',
      'confidence', 0.95
    );
  ELSIF textract_value = openai_value OR textract_value = claude_value THEN
    -- Textract agrees with at least one
    consensus_value := textract_value;
    result := jsonb_build_object(
      'value', consensus_value,
      'agreement', 'majority',
      'confidence', 0.80
    );
  ELSIF openai_value = claude_value THEN
    -- OpenAI and Claude agree
    consensus_value := openai_value;
    result := jsonb_build_object(
      'value', consensus_value,
      'agreement', 'majority',
      'confidence', 0.85
    );
  ELSE
    -- No agreement, use OpenAI as default
    consensus_value := openai_value;
    result := jsonb_build_object(
      'value', consensus_value,
      'agreement', 'conflict',
      'confidence', 0.60
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-flag documents for review based on confidence
CREATE OR REPLACE FUNCTION check_document_review_requirement()
RETURNS TRIGGER AS $$
BEGIN
  -- Flag for review if overall confidence is low
  IF NEW.overall_confidence IS NOT NULL AND NEW.overall_confidence < 0.70 THEN
    NEW.requires_review := true;
  END IF;
  
  -- Flag for review if validation errors exist
  IF NEW.validation_errors IS NOT NULL AND 
     jsonb_array_length(NEW.validation_errors) > 0 THEN
    -- Check if any errors are critical
    IF EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(NEW.validation_errors) AS err
      WHERE err->>'severity' = 'critical'
    ) THEN
      NEW.requires_review := true;
    END IF;
  END IF;
  
  -- Flag for review if models disagree on critical fields
  IF NEW.extraction_consensus IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_each(NEW.extraction_consensus) AS field
      WHERE field.key IN ('total_amount', 'invoice_number', 'vendor_name')
        AND field.value->>'agreement' = 'conflict'
    ) THEN
      NEW.requires_review := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS document_review_check ON documents;
CREATE TRIGGER document_review_check
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION check_document_review_requirement();

-- Add RLS policies for review fields
CREATE POLICY "Users can update review status for their documents"
  ON documents
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create a table to track extraction accuracy metrics
CREATE TABLE IF NOT EXISTS extraction_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  extraction_date timestamp with time zone DEFAULT now(),
  
  -- Model agreement metrics
  unanimous_fields integer DEFAULT 0,
  majority_fields integer DEFAULT 0,
  conflicting_fields integer DEFAULT 0,
  total_fields integer DEFAULT 0,
  agreement_score numeric(3,2),
  
  -- Validation metrics
  validation_errors integer DEFAULT 0,
  validation_warnings integer DEFAULT 0,
  auto_corrections integer DEFAULT 0,
  
  -- Performance metrics
  preprocessing_time_ms integer,
  textract_time_ms integer,
  openai_time_ms integer,
  claude_time_ms integer,
  total_processing_time_ms integer,
  
  -- Cost tracking
  textract_cost numeric(10,4),
  openai_cost numeric(10,4),
  claude_cost numeric(10,4),
  total_cost numeric(10,4),
  
  -- Accuracy tracking (after human review)
  human_corrections integer,
  accuracy_score numeric(3,2),
  
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS to extraction_metrics
ALTER TABLE extraction_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extraction metrics"
  ON extraction_metrics
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own extraction metrics"
  ON extraction_metrics
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create an index for metrics analysis
CREATE INDEX IF NOT EXISTS idx_extraction_metrics_user_date 
ON extraction_metrics(user_id, extraction_date DESC);

-- Create a summary view for extraction metrics
CREATE OR REPLACE VIEW extraction_metrics_summary AS
SELECT 
  user_id,
  COUNT(*) as total_extractions,
  AVG(agreement_score) as avg_agreement_score,
  AVG(overall_confidence) as avg_confidence,
  SUM(validation_errors) as total_validation_errors,
  AVG(total_processing_time_ms) as avg_processing_time_ms,
  SUM(total_cost) as total_cost,
  AVG(accuracy_score) as avg_accuracy_score,
  DATE_TRUNC('day', extraction_date) as date
FROM extraction_metrics em
JOIN documents d ON em.document_id = d.id
WHERE extraction_date > now() - interval '30 days'
GROUP BY user_id, DATE_TRUNC('day', extraction_date)
ORDER BY date DESC;

-- Add comments for documentation
COMMENT ON COLUMN documents.extraction_models IS 'Array of models used for extraction (textract, openai, claude)';
COMMENT ON COLUMN documents.model_confidences IS 'Individual confidence scores for each model';
COMMENT ON COLUMN documents.validation_errors IS 'Array of validation errors found during processing';
COMMENT ON COLUMN documents.requires_review IS 'Flag indicating document needs human review';
COMMENT ON COLUMN documents.extraction_consensus IS 'Field-level consensus data from multiple models';
COMMENT ON COLUMN documents.preprocessing_applied IS 'Whether image preprocessing was applied';
COMMENT ON COLUMN documents.overall_confidence IS 'Combined confidence score from all models and validation';