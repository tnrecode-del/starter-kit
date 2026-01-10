import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@core/trpc";

export const trpc = createTRPCReact<AppRouter>();
