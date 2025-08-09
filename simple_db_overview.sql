-- Simple Database Discovery - No errors guaranteed

-- 1. What tables exist?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. What columns exist in each table?
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;