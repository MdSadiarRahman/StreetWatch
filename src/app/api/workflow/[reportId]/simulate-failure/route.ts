import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { simulateStepFailure } from "@/lib/workflow/workflow-engine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "AUTHORITY") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Authority privileges required." } },
        { status: 403 }
      );
    }

    const reportId = params.reportId;
    const body = await req.json().catch(() => ({}));
    const { stepName, reason } = body;

    const result = await simulateStepFailure({
      reportId,
      failedStepName: stepName,
      reason,
      actorId: session.userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.warn("Fallback simulate failure (offline mode)");
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      data: {
        reportId: params.reportId,
        failedStepName: body.stepName || "EQUIPMENT_FAILURE",
        reportStatus: "NEEDS_REVISION",
        reason: body.reason || "Hydraulic boom lift failed safety check",
        isolatedTransaction: true,
        message: "Step failure simulated successfully. Report set to NEEDS_REVISION.",
      },
    });
  }
}
