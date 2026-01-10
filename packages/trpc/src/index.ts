import { router } from "./trpc.js";
import { userRouter } from "./router/users.js";

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
export { createTRPCContext } from "./trpc.js";
