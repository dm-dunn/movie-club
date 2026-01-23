# Production Migration Instructions

## Issue
The application is failing in production with the error:
```
The column `(not available)` does not exist in the current database.
```

This is because the `watchedBy` column was added to the Prisma schema but doesn't exist in the production database yet.

## Solution

You need to add the `watched_by` column to the production database **before** deploying the new code.

### Option 1: Run SQL Directly (Recommended - Fastest)

1. Connect to your production PostgreSQL database
2. Run the SQL script located at `scripts/add-watchedby-column.sql`

```bash
# If using Render's psql command:
psql $DATABASE_URL -f scripts/add-watchedby-column.sql

# Or copy/paste the SQL directly into your database console
```

The SQL script will:
- Add the `watched_by` column to the `movies` table
- Populate it with existing user ratings
- Show you a verification query

### Option 2: Run the TypeScript Migration Script

If you prefer to use the TypeScript migration script:

```bash
# Set your production DATABASE_URL and run:
npm run db:migrate-watchedby
```

## Verification

After running the migration, verify it worked:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'movies'
AND column_name = 'watched_by';
```

You should see:
```
 column_name | data_type
-------------+-----------
 watched_by  | ARRAY
```

## Redeploy

Once the migration is complete, trigger a new deployment and the application should work correctly.

## What Changed

- Added `watchedBy: String[]` field to the `Movie` model in `prisma/schema.prisma`
- This field tracks which users have watched (rated) each movie
- Updated the rating API to add users to this array when they rate a movie
