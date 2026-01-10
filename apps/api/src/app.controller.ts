import { Inject, Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service.js";

@Controller("users")
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  async getHello() {
    return this.appService.getUsers();
  }
}
