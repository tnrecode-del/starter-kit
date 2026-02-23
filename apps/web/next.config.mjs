import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@core/shared", "@core/trpc", "@core/config-tailwind"],
  serverExternalPackages: ["@core/database", "pg", "@prisma/adapter-pg"],
};

export default withNextIntl(nextConfig);
