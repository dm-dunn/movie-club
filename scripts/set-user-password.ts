import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
