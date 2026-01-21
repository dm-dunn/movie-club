-- AlterTable
ALTER TABLE "users" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- Set a temporary default password for existing users
UPDATE "users" SET "password" = '$2a$10$dummyHashValueForExistingUsers' WHERE "password" = '';
