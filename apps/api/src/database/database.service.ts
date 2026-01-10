import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import * as dbPackage from "@core/database";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  public client!: dbPackage.PrismaClient;

  async onModuleInit() {
    // Присваиваем только в момент инициализации модуля NestJS
    // Это гарантирует, что @core/database уже полностью загружен в память
    this.client = dbPackage.db;

    if (!this.client) {
      throw new Error(
        "CRITICAL: Prisma client (db) is undefined. Check exports in @core/database",
      );
    }

    await this.client.$connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.$disconnect();
    }
  }
}
