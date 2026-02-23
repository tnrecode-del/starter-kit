import { NextResponse } from "next/server";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Reuse the same Redis connection settings
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// We create a single connection for the API route
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

const queue = new Queue("feature-processing", {
  connection: connection as any,
});

export async function GET() {
  try {
    const isPaused = await queue.isPaused();
    return NextResponse.json({ isPaused });
  } catch (error) {
    console.error("Failed to get queue status:", error);
    return NextResponse.json(
      { error: "Failed to get queue status" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    switch (action) {
      case "pause":
        await queue.pause();
        break;
      case "resume":
        await queue.resume();
        break;
      case "drain":
        await queue.drain();
        // Also clean up any active/failed/delayed jobs if strictly stopping
        await queue.obliterate({ force: true }).catch(() => {
          // Obliterate might fail if workers are active, which is fine
          // The main goal is just to clear the pending jobs (drain)
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const isPaused = await queue.isPaused();
    return NextResponse.json({ success: true, isPaused });
  } catch (error) {
    console.error(`Queue action failed:`, error);
    return NextResponse.json(
      { error: "Failed to perform queue action" },
      { status: 500 },
    );
  }
}
