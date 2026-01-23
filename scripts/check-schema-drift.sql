-- Check for schema drift between Prisma schema and actual database

-- Check users table columns
SELECT 'Users table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check movies table columns
SELECT 'Movies table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'movies'
ORDER BY ordinal_position;

-- Expected columns that might be missing:
-- Users table should have: username, password (might be missing)
-- Movies table should have: watched_by (we know this is missing)
