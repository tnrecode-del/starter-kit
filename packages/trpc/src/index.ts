import { router } from "./trpc.js";
import { userRouter } from "./router/users.router.js";
import { authRouter } from "./router/auth.router.js";

export const appRouter = router({
  user: userRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
export { createTRPCContext } from "./trpc.js";
