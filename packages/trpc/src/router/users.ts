import { router, publicProcedure } from "../trpc.js";
import { z } from "zod";

export const userRouter = router({
  getUsers: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany();
  }),

  create: publicProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.user.create({ data: input });
    }),
});
