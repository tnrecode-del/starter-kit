import { Controller, Get } from "@nestjs/common";

import { DatabaseService } from "./database/database.service.js";

@Controller("users")
export class AppController {
  constructor(private readonly dataBaseService: DatabaseService) {}

  @Get()
  getHello() {
    return this.dataBaseService.client.user.count();
  }
}
