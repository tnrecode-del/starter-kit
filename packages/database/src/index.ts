import { PrismaClient as GeneratedClient } from "../prisma/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import process from "node:process";

// Важно: экспортируем типы отдельно
export * from "../prisma/generated/client.js";

declare global {
  var prisma: GeneratedClient | undefined;
}

const createClient = (): GeneratedClient => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new GeneratedClient({ adapter });
};

// Экспортируем константу db напрямую
export const db = globalThis.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
