import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Add password column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
    `);

    // Update existing users with a default hashed password
    // This is a bcrypt hash of 'changeme' - users should change this on first login
    await prisma.$executeRawUnsafe(`
      UPDATE users SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' WHERE password = '';
    `);

    console.log("✓ Successfully added password column to users table");
  } catch (error) {
    console.error("Error adding password column:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
