-- Simple fix for accounting status trigger
-- Allows manual status updates while preserving automated logic

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_accounting_status_trigger ON documents;
DROP FUNCTION IF EXISTS update_accounting_status();

-- Create simple trigger that allows manual overrides
CREATE OR REPLACE FUNCTION update_accounting_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If accounting_status is being manually changed, allow it
  IF TG_OP = 'UPDATE' AND OLD.accounting_status IS DISTINCT FROM NEW.accounting_status THEN
    -- Manual status update detected - allow it and skip automatic logic
    RETURN NEW;
  END IF;
  
  -- Apply automatic status logic only for INSERT or other field changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.accounting_status = NEW.accounting_status) THEN
    -- Apply business rules for automatic updates
    IF NEW.requires_review = true THEN
      -- If requires review is true, always needs mapping
      NEW.accounting_status = 'needs_mapping';
    ELSIF check_accounting_data_complete(NEW.id) AND NEW.mapping_confidence >= 0.8 THEN
      -- Only ready for export if data is complete, confidence is high, AND doesn't require review
      NEW.accounting_status = 'ready_for_export';
    ELSE
      -- Default to needs mapping
      NEW.accounting_status = 'needs_mapping';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_accounting_status_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_status();

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_accounting_status() TO authenticated;