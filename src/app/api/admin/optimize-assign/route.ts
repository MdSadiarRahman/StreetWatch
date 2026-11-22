import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { optimizeWorkerAssignment, ResolutionStrategy } from "@/lib/ai/priority-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "AUTHORITY") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Authority privileges required." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reportId, resolutionStrategy, manualWorkerId } = body;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "reportId is required." } },
        { status: 400 }
      );
    }

    const result = await optimizeWorkerAssignment({
      reportId,
      resolutionStrategy: (resolutionStrategy as ResolutionStrategy) || "STRICT",
      assignedById: session.userId,
      manualWorkerId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Optimize Assign Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "ASSIGN_ERROR", message: err.message || "Failed to execute worker assignment." } },
      { status: 500 }
    );
  }
}
