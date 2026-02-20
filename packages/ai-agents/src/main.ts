/**
 * Entry point — Orchestrator v4
 * Run: node dist/main.js
 */

import dotenv from "dotenv";
dotenv.config();

import pino from "pino";
import { loadConfig } from "./types.js";
import { MVPOrchestrator } from "./orchestrator_v4.js";
import type { FeatureRequest } from "./types.js";

const log = pino({ name: "main" });

async function main(): Promise<void> {
  log.info("🤖 MVP Agent System v4.0 — Production");

  const config = loadConfig();
  const orchestrator = new MVPOrchestrator(config);
  await orchestrator.initialize();

  // Example feature — replace with your queue or CLI args
  const testFeature: FeatureRequest = {
    id: "FEAT-001",
    title: "User Authentication with JWT",
    description:
      "JWT-based auth with login, signup, password reset, and refresh tokens",
    acceptanceCriteria: [
      "Users register with email/password",
      "Login returns access + refresh JWT tokens",
      "Access tokens expire in 15 minutes",
      "Refresh tokens expire in 7 days",
      "Password reset via email link",
    ],
    complexity: "medium",
    priority: "critical",
    businessValue: "Core security for user access control",
  };

  await orchestrator.runLoop([testFeature]);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
