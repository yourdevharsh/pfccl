import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../config.js";

let prisma;

export function getPrisma() {
  if (!config.databaseUrl) {
    const error = new Error("DATABASE_URL is not configured. Add it to backend/.env before starting the server.");
    error.status = 503;
    throw error;
  }
  if (!prisma) {
    const adapter = new PrismaPg({
      connectionString: config.databaseUrl,
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export async function connectDatabase() {
  const client = getPrisma();
  await client.$connect();
  return client;
}

export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
