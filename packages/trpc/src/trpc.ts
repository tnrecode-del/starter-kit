import { initTRPC } from "@trpc/server";
import { db } from "@core/database";

export const createTRPCContext = async () => ({
  db,
});

// В v11 рекомендуется явно указывать контекст через функцию
const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
