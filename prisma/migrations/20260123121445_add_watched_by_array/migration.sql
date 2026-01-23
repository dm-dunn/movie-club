-- AlterTable
ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "watched_by" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Populate watchedBy array based on existing ratings
UPDATE movies m
SET watched_by = COALESCE(
  (
    SELECT ARRAY_AGG(DISTINCT r.user_id)
    FROM ratings r
    WHERE r.movie_id = m.id
  ),
  ARRAY[]::TEXT[]
)
WHERE watched_by = ARRAY[]::TEXT[]
OR watched_by IS NULL;
