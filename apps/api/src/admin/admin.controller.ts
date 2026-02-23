import { Controller, Post, Get } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";

@Controller("admin")
export class AdminController {
  constructor(private readonly db: DatabaseService) {}

  @Post("queue/reset")
  async resetQueue() {
    await this.db.client.featureQueue.deleteMany({});
    return { success: true, message: "Queue truncated successfully" };
  }

  @Get("queue/list")
  async listQueue() {
    return this.db.client.featureQueue.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        executionMetric: true,
        roiMetric: true,
      },
    });
  }
}
