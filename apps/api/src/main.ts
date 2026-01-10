import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import * as trpcExpress from "@trpc/server/adapters/express";
import { AppModule } from "./app.module.js";

import { appRouter, createTRPCContext } from "@core/trpc";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");

  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });

  // Подключаем tRPC адаптер
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
