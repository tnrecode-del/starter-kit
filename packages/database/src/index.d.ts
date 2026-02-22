import { PrismaClient as GeneratedClient } from "../prisma/generated/client.js";
export * from "../prisma/generated/client.js";
declare global {
  var prisma: GeneratedClient | undefined;
}
export declare const db: GeneratedClient;
