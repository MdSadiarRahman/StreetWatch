import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ReportStatus, WorkflowStepStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "CITIZEN") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Citizen sign-in required for resolution sign-off." } },
        { status: 401 }
      );
    }

    const reportId = params.id;
    const report = await db.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Report not found." } },
        { status: 404 }
      );
    }

    // Only the original reporter can execute final sign-off (M03 Resource Isolation)
    if (report.reporterId !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the citizen who originally submitted this report can verify resolution completion.",
          },
        },
        { status: 403 }
      );
    }

    if (report.status !== ReportStatus.RESOLVED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Sign-off can only be submitted for reports in RESOLVED status.",
          },
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { approved, satisfactionRating = 5, feedback } = body;

    const result = await db.$transaction(async (tx) => {
      if (approved) {
        // Confirm resolution & close ticket
        const closedReport = await tx.report.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.CITIZEN_VERIFIED,
          },
        });

        // Award trust score to citizen
        await tx.user.update({
          where: { id: session.userId },
          data: {
            trustScore: { increment: 0.1 },
          },
        });

        // Log Final Step in Workflow
        await tx.workflowStepLog.create({
          data: {
            reportId,
            stepName: "STEP_7_CITIZEN_SIGNOFF",
            status: WorkflowStepStatus.SUCCESS,
            attemptCount: 1,
            recoveryAction: null,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: session.userId,
            action: "CITIZEN_SIGNOFF_ACCEPT",
            entityType: "Report",
            entityId: reportId,
            metadata: { satisfactionRating, feedback },
          },
        });

        return {
          status: "CITIZEN_VERIFIED",
          message: "Thank you! You have confirmed the repair and the ticket is now officially closed.",
          report: closedReport,
        };
      } else {
        // Reopen ticket back to IN_PROGRESS
        const reopenedReport = await tx.report.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.IN_PROGRESS,
          },
        });

        await tx.workflowStepLog.create({
          data: {
            reportId,
            stepName: "STEP_7_CITIZEN_SIGNOFF",
            status: WorkflowStepStatus.RETRIED,
            attemptCount: 2,
            errorMessage: feedback || "Citizen disputed repair quality. Reopened.",
            recoveryAction: "Ticket returned to IN_PROGRESS for field re-inspection.",
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: session.userId,
            action: "CITIZEN_SIGNOFF_REOPEN",
            entityType: "Report",
            entityId: reportId,
            metadata: { feedback },
          },
        });

        return {
          status: "IN_PROGRESS",
          message: "Dispute recorded. Issue has been reopened and returned to field crew.",
          report: reopenedReport,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Signoff Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to process sign-off." } },
      { status: 500 }
    );
  }
}
