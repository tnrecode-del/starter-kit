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

    const feature = await db.featureQueue.findUnique({
      where: { featureId },
    });

    if (!feature) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await db.$transaction([
      db.executionMetric.deleteMany({ where: { featureId: feature.id } }),
      db.roiMetric.deleteMany({ where: { featureId: feature.id } }),
      db.featureQueue.update({
        where: { featureId },
        data: {
          status: "PENDING",
          resultData: null,
          executionLog: null,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error retrying task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
