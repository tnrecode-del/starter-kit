import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import * as trpcExpress from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";

import { appRouter, createTRPCContext } from "@core/trpc";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.use(cookieParser());

  app.enableCors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  });

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter as any,
      createContext: createTRPCContext,
    }),
  );

  await app.listen(4000);
  console.warn(`🚀 Backend is running on: http://localhost:4000/api`);
}
bootstrap();
