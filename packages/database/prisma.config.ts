// @ts-expect-error: Node.js types are not resolved in the package root by ESLint
import process from "node:process";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file=../../.env prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
