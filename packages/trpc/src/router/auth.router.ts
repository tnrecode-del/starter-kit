import { router, publicProcedure, protectedProcedure } from "../trpc.js";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      let user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        user = await ctx.db.user.create({
          data: { email: input.email, name: input.email.split("@")[0] },
        });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      ctx.res.cookie("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return { success: true, user };
    }),

  me: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie("auth-token");
    return { success: true };
  }),
});
