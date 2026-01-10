import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "./database/database.service.js";

@Injectable()
export class AppService {
  constructor(
    @Inject(DatabaseService) private readonly dbService: DatabaseService,
  ) {}

  async getUsers() {
    return this.dbService.client.user.findMany();
  }
}
