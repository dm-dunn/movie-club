-- AlterTable: Add username column and make email optional
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Drop the old email unique constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
        ALTER TABLE "users" DROP CONSTRAINT "users_email_key";
    END IF;
END $$;

-- Update existing users to have username (firstname + 1)
-- This assumes users have names, extracts first word, lowercases it, and appends 1
UPDATE "users"
SET "username" = LOWER(SPLIT_PART("name", ' ', 1)) || '1'
WHERE "username" IS NULL;

-- Now make username required and unique
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
