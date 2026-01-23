-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "average_rating" DECIMAL(3,2);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP DEFAULT;
