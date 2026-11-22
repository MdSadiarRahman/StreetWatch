import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { recoverWorkflow } from "@/lib/workflow/workflow-engine";

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
    const result = await recoverWorkflow({
      reportId,
      actorId: session.userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Workflow Recovery Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "RECOVERY_ERROR", message: err.message || "Failed to recover workflow." } },
      { status: 500 }
    );
  }
}
