import { PrismaClient as GeneratedClient } from "../prisma/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import process from "node:process";

export * from "../prisma/generated/client.js";

declare global {
  var prisma: GeneratedClient | undefined;
}

const createClient = () => {
  // 1. Создаем пул соединений через стандартный pg
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // 2. Оборачиваем его в адаптер Prisma
  const adapter = new PrismaPg(pool);

  // 3. Передаем адаптер в конструктор.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (GeneratedClient as any)({ adapter }) as GeneratedClient;
};

export const db = globalThis.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
