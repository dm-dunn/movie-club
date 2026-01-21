import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Initialize Prisma client with pg adapter for PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isAdmin: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (users.length === 0) {
      console.log("No users found in the database.");
      console.log("\nTo create users, you can:");
      console.log("1. Add a user: npm run db:add-user \"Name\" email@example.com 'password'");
      console.log("2. Run the seed script: npm run db:seed");
    } else {
      console.log(`\nFound ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Admin: ${user.isAdmin}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

listUsers();
