-- Fix Stage 18 Accounting Status Trigger
-- Allow manual overrides for accounting_status while preserving automated logic

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS update_accounting_status_trigger ON documents;
DROP FUNCTION IF EXISTS update_accounting_status();

-- Create improved function that respects manual updates
CREATE OR REPLACE FUNCTION update_accounting_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-update status if it's not being manually set
  -- Check if accounting_status is explicitly being updated (manual override)
  IF TG_OP = 'UPDATE' AND OLD.accounting_status IS DISTINCT FROM NEW.accounting_status THEN
    -- Manual status update detected - allow it and skip automatic logic
    RETURN NEW;
  END IF;
  
  -- Only auto-update on INSERT or when other fields change (not status itself)
  IF TG_OP = 'INSERT' OR NEW.accounting_status = OLD.accounting_status THEN
    -- Apply automatic status logic only for non-manual updates
    
    -- If all required fields are populated and confidence is high
    IF check_accounting_data_complete(NEW.id) 
       AND NEW.mapping_confidence >= 0.8 
       AND NOT NEW.requires_review THEN
      NEW.accounting_status = 'ready_for_export';
    -- If data is complete but needs review
    ELSIF check_accounting_data_complete(NEW.id) AND NEW.requires_review THEN
      NEW.accounting_status = 'needs_mapping';
    -- If data is incomplete
    ELSE
      NEW.accounting_status = 'needs_mapping';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the improved function
CREATE TRIGGER update_accounting_status_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_status();

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_accounting_status() TO authenticated;