import { Injectable } from "@nestjs/common";
import { appRouter, createTRPCContext } from "@core/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";

@Injectable()
export class TrpcService {
  readonly appRouter = appRouter;

  async createMiddleware() {
    return trpcExpress.createExpressMiddleware({
      router: this.appRouter,
      createContext: createTRPCContext,
    });
  }
}
