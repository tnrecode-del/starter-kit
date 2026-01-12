import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@core/database";
import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export const createTRPCContext = async ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}) => {
  const token = req.cookies("auth-token");
  let user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
      };
      user = await db.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("JWT Verification failed:", message);
    }
  }

  return {
    db,
    req,
    res,
    user,
  };
};

// В v11 рекомендуется явно указывать контекст через функцию
const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Нужно войти в систему",
    });

  return next({ ctx: { user: ctx.user } });
});
