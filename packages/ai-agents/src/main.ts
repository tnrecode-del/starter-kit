/**
 * Entry point — Orchestrator v4
 * Run: node dist/main.js
 */

import dotenv from "dotenv";
dotenv.config();

import pino from "pino";
import { loadConfig } from "./types.js";
import { MVPOrchestrator } from "./orchestrator_v4.js";

const log = pino({ name: "main" });

async function main(): Promise<void> {
  log.info("🤖 MVP Agent System v4.0 — Production");

  const config = loadConfig();
  const orchestrator = new MVPOrchestrator(config);
  await orchestrator.initialize();

  await orchestrator.runLoop();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
