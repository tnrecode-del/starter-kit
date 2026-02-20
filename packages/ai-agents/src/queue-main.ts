/**
 * Entry point — BullMQ Queue Worker
 * Run: node dist/queue-main.js
 */

import dotenv from "dotenv";
dotenv.config();

import pino from "pino";
import { FeatureQueue } from "./task_queue.js";

const log = pino({ name: "queue-main" });

async function main(): Promise<void> {
  log.info("🔄 MVP Agent Queue — 24/7 Processing");

  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const queue = new FeatureQueue(redisUrl);

  await queue.startWorker();

  process.on("SIGINT", async () => {
    log.info("Shutting down queue worker");
    await queue.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await queue.shutdown();
    process.exit(0);
  });

  log.info("Queue worker running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("Queue fatal error:", err);
  process.exit(1);
});
