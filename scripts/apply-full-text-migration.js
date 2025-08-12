#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service key
const supabaseUrl = 'https://pgrnpspobiiwqyjlixoi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm5wc3BvYmlpd3F5amxpeG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NjUzNCwiZXhwIjoyMDY5NDcyNTM0fQ.g5pQMCRgnTJAHxwqS2MIFn95CQ0Zx7RlYFp8SqZTDcU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFullTextMigration() {
  try {
    console.log('📝 Applying full_text column migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250113_add_full_text_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL:');
    console.log('=' * 50);
    console.log(migrationSQL);
    console.log('=' * 50);
    console.log('\n');
    
    // For Supabase, we need to use direct database connection
    // The easiest way is to run this via Supabase Dashboard SQL Editor
    
    console.log('⚠️  IMPORTANT: This migration needs to be run directly in Supabase.\n');
    console.log('Please follow these steps:\n');
    console.log('1. Go to https://supabase.com/dashboard/project/pgrnpspobiiwqyjlixoi');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the migration SQL above');
    console.log('5. Click "Run" to execute the migration\n');
    console.log('The migration will:');
    console.log('  ✅ Add full_text column to documents table');
    console.log('  ✅ Create a GIN index for full-text search');
    console.log('  ✅ Add a search_documents_by_text() function');
    console.log('\n✨ After running the migration, new documents will have their full text saved!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyFullTextMigration();