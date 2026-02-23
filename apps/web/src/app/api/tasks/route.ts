import { NextResponse } from "next/server";
import { db } from "@core/database/dist/src/index.js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, requirements, priority } = body;

    if (!title || !requirements) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // FeatureID needs to be unique. Find the max featureId to autoincrement
    const lastTask = await db.featureQueue.findFirst({
      orderBy: { featureId: "desc" },
    });
    const nextFeatureId = (lastTask?.featureId || 0) + 1;

    const task = await db.featureQueue.create({
      data: {
        featureId: nextFeatureId,
        name: title,
        category: "Generated",
        status: "PENDING",
        priority: priority === "turbo" ? "HIGH" : "MEDIUM",
        testSteps: requirements,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
