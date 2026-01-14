import { router, publicProcedure } from "../trpc.js";
import { LoginInputSchema } from "@core/shared/schemas/user.schema.js";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

export const authRouter = router({
  login: publicProcedure
    .input(LoginInputSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) throw new Error("No user found");

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
