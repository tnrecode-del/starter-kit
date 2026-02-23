import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

// Function to parse the Pino JSON logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featureIdParam = searchParams.get("featureId");

    const logFilePath = path.join(
      process.cwd(),
      "../../packages/ai-agents/orchestrator.log",
    );

    // Check if file exists
    try {
      await fs.access(logFilePath);
    } catch {
      return NextResponse.json({ logs: [] });
    }

    const logContent = await fs.readFile(logFilePath, "utf-8");
    const logLines = logContent.split("\n").filter(Boolean);

    let parsedLogs = logLines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (featureIdParam) {
      const featureId = parseInt(featureIdParam, 10);
      parsedLogs = parsedLogs.filter(
        (l) => l.featureId === featureId || l.featureId === `feat-${featureId}`,
      );
    }

    // Return the last 500 logs to avoid overwhelming the client
    const recentLogs = parsedLogs.slice(-500);
    return NextResponse.json({ logs: recentLogs });
  } catch (error) {
    console.error("Failed to read orchestrator logs:", error);
    return NextResponse.json({ error: "Failed to read logs" }, { status: 500 });
  }
}
