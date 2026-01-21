import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Check if we're using a regular PostgreSQL connection (local) or Prisma Accelerate
const isDatabaseUrlRegularPostgres =
  process.env.DATABASE_URL?.startsWith("postgresql://");

let prismaInstance: PrismaClient;

if (isDatabaseUrlRegularPostgres) {
  // Use pg adapter for regular PostgreSQL connections
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });
} else {
  // Use default Prisma client for Prisma Accelerate
  prismaInstance = new PrismaClient();
}

export const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
