import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Initialize Prisma client with pg adapter for PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setUserPassword(email: string, password: string) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✓ Password set successfully for user: ${user.name} (${user.email})`);
  } catch (error) {
    console.error("Error setting password:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: tsx scripts/set-user-password.ts <email> <password>");
  process.exit(1);
}

setUserPassword(email, password);
