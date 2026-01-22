import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Initialize Prisma client with pg adapter for PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resolveMigration() {
  try {
    console.log("Marking failed migration as rolled back...");

    // Mark the failed migration as rolled back so it can be reapplied
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = '20260122104319_add_username_field'
      AND finished_at IS NULL;
    `);

    console.log("✓ Failed migration marked as rolled back");
    console.log("You can now redeploy and the migration will be reapplied");
  } catch (error) {
    console.error("Error resolving migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resolveMigration();
