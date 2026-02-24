import { NextResponse } from "next/server";
import { db } from "@core/database/dist/src/index.js";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing task UUID" }, { status: 400 });
    }
    const task = await db.featureQueue.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only tasks in DRAFT state can be started manually" },
        { status: 400 },
      );
    }

    const updatedTask = await db.featureQueue.update({
      where: { id },
      data: { status: "PENDING" },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Failed to start task:", error);
    return NextResponse.json(
      { error: "Failed to start task execution" },
      { status: 500 },
    );
  }
}
