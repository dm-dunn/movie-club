import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Initialize Prisma client with pg adapter for PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setUserPassword(username: string, password: string) {
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      console.error(`✗ User with username "${username}" not found in database.`);
      console.log("\nTo see all users, run: npm run db:list-users");
      console.log("To create users, run: npm run db:add-user");
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user
    const user = await prisma.user.update({
      where: { username },
      data: { password: hashedPassword },
    });

    console.log(`✓ Password set successfully for user: ${user.name} (${user.username})`);
  } catch (error) {
    console.error("Error setting password:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Get username and password from command line arguments
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error("Usage: tsx scripts/set-user-password.ts <username> <password>");
  process.exit(1);
}

setUserPassword(username, password);
