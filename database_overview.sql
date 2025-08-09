-- Database Discovery Query - Find what actually exists
-- Step 1: Discover all tables that exist
SELECT 'EXISTING TABLES' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 2: Show structure of each table
SELECT 'TABLE STRUCTURES' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Step 3: Simple approach - just list tables first
SELECT 'STEP 3 - JUST TABLES' as section;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Step 4: Show enums
SELECT 'ENUM TYPES' as section;
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%enum%'
ORDER BY t.typname, e.enumsortorder;

-- Step 5: Show custom functions
SELECT 'CUSTOM FUNCTIONS' as section;
SELECT 
    routines.routine_name,
    routines.routine_type,
    routines.data_type as return_type
FROM information_schema.routines 
WHERE routines.specific_schema = 'public'
AND routines.routine_name NOT LIKE 'pg_%'
ORDER BY routines.routine_name;