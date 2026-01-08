import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");

  await app.listen(4000);
  console.warn(`🚀 Backend is running on: http://localhost:4000/api`);
}
bootstrap();
