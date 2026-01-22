-- AlterTable: Add username column and make email optional
ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Create a temporary unique constraint name to drop the old email unique constraint
ALTER TABLE "users" DROP CONSTRAINT "users_email_key";

-- Update existing users to have username (firstname + 1)
-- This assumes users have names, extracts first word, lowercases it, and appends 1
UPDATE "users"
SET "username" = LOWER(SPLIT_PART("name", ' ', 1)) || '1'
WHERE "username" IS NULL;

-- Now make username required and unique
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
