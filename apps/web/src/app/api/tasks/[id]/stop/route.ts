import { NextRequest, NextResponse } from "next/server";
import { db } from "@core/database";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const p = await params;
    const featureId = parseInt(p.id, 10);

    if (isNaN(featureId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await db.featureQueue.update({
      where: { featureId },
      data: {
        status: "FAILED",
        resultData: "Task was manually stopped by the user.",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error stopping task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
