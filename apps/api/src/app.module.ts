import { Module } from "@nestjs/common";

import { AppController } from "./app.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { AppService } from "./app.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
