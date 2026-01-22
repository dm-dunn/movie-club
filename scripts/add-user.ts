import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Initialize Prisma client with pg adapter for PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addUser(name: string, username: string, password: string, isAdmin: boolean = false) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.error(`✗ User with username "${username}" already exists.`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   To update their password, run: npm run db:set-password ${username} 'newpassword'`);
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        isAdmin,
        isActive: true,
      },
    });

    console.log(`✓ User created successfully!`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Admin: ${user.isAdmin}`);
    console.log(`   Active: ${user.isActive}`);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Get arguments from command line
const name = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];
const isAdmin = process.argv[5] === "--admin";

if (!name || !username || !password) {
  console.error("Usage: tsx scripts/add-user.ts <name> <username> <password> [--admin]");
  console.error("\nExamples:");
  console.error('  npm run db:add-user "John Doe" john1 \'password123\'');
  console.error('  npm run db:add-user "Admin User" admin1 \'admin123\' --admin');
  process.exit(1);
}

addUser(name, username, password, isAdmin);
