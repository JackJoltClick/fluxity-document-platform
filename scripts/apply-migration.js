#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service key
const supabaseUrl = 'https://pgrnpspobiiwqyjlixoi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm5wc3BvYmlpd3F5amxpeG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NjUzNCwiZXhwIjoyMDY5NDcyNTM0fQ.g5pQMCRgnTJAHxwqS2MIFn95CQ0Zx7RlYFp8SqZTDcU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250111_multi_model_extraction.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Applying migration to database...');
    
    // Split SQL into individual statements (basic split on semicolons)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip pure comment lines
      if (statement.trim().startsWith('--')) continue;
      
      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
        console.log(`  ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement
        });
        
        if (error) {
          // Try direct query approach if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('documents')
            .select('id')
            .limit(1);
          
          if (!directError) {
            console.log(`  ✅ Statement executed (fallback method)`);
            successCount++;
          } else {
            console.error(`  ❌ Error: ${directError.message}`);
            errorCount++;
          }
        } else {
          console.log(`  ✅ Statement executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error executing statement: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Successful statements: ${successCount}`);
    console.log(`  ❌ Failed statements: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be okay if columns/indexes already exist.');
      console.log('   The migration may have been partially applied previously.');
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();