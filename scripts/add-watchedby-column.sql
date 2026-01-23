-- Add watchedBy column to movies table
-- Run this SQL directly on production database before deploying new code

-- Step 1: Add the column with default empty array
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS watched_by TEXT[] DEFAULT '{}';

-- Step 2: Populate watched_by with existing user ratings
UPDATE movies m
SET watched_by = (
  SELECT COALESCE(array_agg(DISTINCT r.user_id), '{}')
  FROM ratings r
  WHERE r.movie_id = m.id
)
WHERE EXISTS (
  SELECT 1 FROM ratings r WHERE r.movie_id = m.id
);

-- Verify the update
SELECT
  title,
  array_length(watched_by, 1) as users_count
FROM movies
WHERE array_length(watched_by, 1) > 0
ORDER BY array_length(watched_by, 1) DESC
LIMIT 10;
