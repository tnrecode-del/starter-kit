import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { db } from "@core/database";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  public readonly client = db;

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
