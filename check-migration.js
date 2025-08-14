const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pgrnpspobiiwqyjlixoi.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm5wc3BvYmlpd3F5amxpeG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NjUzNCwiZXhwIjoyMDY5NDcyNTM0fQ.g5pQMCRgnTJAHxwqS2MIFn95CQ0Zx7RlYFp8SqZTDcU'
);

async function checkAndCreate() {
  // Check if table exists
  const { data, error } = await supabase
    .from('smart_rules')
    .select('id')
    .limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Table smart_rules does not exist');
    console.log('\nTo create it, please:');
    console.log('1. Go to: https://supabase.com/dashboard/project/pgrnpspobiiwqyjlixoi/sql/new');
    console.log('2. Copy and paste the SQL from: supabase/migrations/20250114_smart_rules.sql');
    console.log('3. Click "Run" to execute the migration');
    console.log('\nThe table will include:');
    console.log('- smart_rules table with all columns');
    console.log('- Proper indexes for performance');
    console.log('- Row Level Security (RLS) policies');
    console.log('- Auto-update triggers for updated_at');
  } else if (!error) {
    console.log('✅ Table smart_rules already exists!');
    
    // Try to count existing rules
    const { count } = await supabase
      .from('smart_rules')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Current rules in database: ${count || 0}`);
  } else {
    console.log('Unexpected error:', error.message);
  }
}

checkAndCreate();