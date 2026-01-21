import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Initialize Prisma client with pg adapter for PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addUser(name: string, email: string, password: string, isAdmin: boolean = false) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`✗ User with email "${email}" already exists.`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   To update their password, run: npm run db:set-password ${email} 'newpassword'`);
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin,
        isActive: true,
      },
    });

    console.log(`✓ User created successfully!`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
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
const email = process.argv[3];
const password = process.argv[4];
const isAdmin = process.argv[5] === "--admin";

if (!name || !email || !password) {
  console.error("Usage: tsx scripts/add-user.ts <name> <email> <password> [--admin]");
  console.error("\nExamples:");
  console.error('  npm run db:add-user "John Doe" john@example.com \'password123\'');
  console.error('  npm run db:add-user "Admin User" admin@example.com \'admin123\' --admin');
  process.exit(1);
}

addUser(name, email, password, isAdmin);
