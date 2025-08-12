const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgrnpspobiiwqyjlixoi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm5wc3BvYmlpd3F5amxpeG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NjUzNCwiZXhwIjoyMDY5NDcyNTM0fQ.g5pQMCRgnTJAHxwqS2MIFn95CQ0Zx7RlYFp8SqZTDcU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  // Get latest ensemble extraction document
  const { data, error } = await supabase
    .from('documents')
    .select('id, filename, extraction_method, accounting_status, extracted_data')
    .like('extraction_method', 'ensemble%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data) {
    console.log('Document ID:', data.id);
    console.log('Filename:', data.filename);
    console.log('Extraction Method:', data.extraction_method);
    console.log('Accounting Status:', data.accounting_status);
    
    if (data.extracted_data?.accounting_fields) {
      console.log('\n=== Accounting Fields Structure ===');
      const fields = data.extracted_data.accounting_fields;
      
      // Check a few sample fields
      const sampleFields = ['invoicing_party', 'document_date', 'invoice_gross_amount'];
      
      sampleFields.forEach(field => {
        if (fields[field]) {
          console.log(`\n${field}:`, JSON.stringify(fields[field], null, 2));
        }
      });
      
      // Count total fields
      console.log('\nTotal fields:', Object.keys(fields).length);
    } else {
      console.log('\nNo accounting_fields found in extracted_data');
    }
  }
}

checkData();