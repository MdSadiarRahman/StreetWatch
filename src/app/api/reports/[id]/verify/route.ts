import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { VoteType, ReportStatus, WorkflowStepStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Please sign in as a citizen to verify this report." },
        },
        { status: 401 }
      );
    }

    const reportId = params.id;
    const body = await req.json().catch(() => ({}));
    const voteType: VoteType = body.voteType === "FLAG_FALSE" ? VoteType.FLAG_FALSE : VoteType.CONFIRM;
    const comment: string | undefined = body.comment?.trim() || undefined;

    // Check report existence
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        category: true,
        aiAnalysis: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Report not found." } },
        { status: 404 }
      );
    }

    // Citizen cannot verify their own submission
    if (report.reporterId === user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "You cannot verify or flag your own reported issue." },
        },
        { status: 403 }
      );
    }

    // Check Duplicate Vote (M06)
    const existingVote = await db.verification.findUnique({
      where: {
        reportId_userId: {
          reportId,
          userId: user.userId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "ALREADY_VOTED", message: "You have already verified or flagged this report." },
        },
        { status: 409 }
      );
    }

    // Transactional Vote + Priority Recalculation + State Progression (M04 / A02 / A07)
    const updated = await db.$transaction(async (tx) => {
      // 1. Create verification record
      await tx.verification.create({
        data: {
          reportId,
          userId: user.userId,
          voteType,
          comment,
        },
      });

      const newVerificationCount =
        voteType === VoteType.CONFIRM
          ? report.verificationCount + 1
          : report.verificationCount;
      const newFlagCount =
        voteType === VoteType.FLAG_FALSE
          ? report.flagCount + 1
          : report.flagCount;

      // 2. Dynamic Priority Recalculation (A02)
      const baseRiskWeight = report.category.baseRiskWeight || 1.0;
      const severityBase = report.severityScore * 0.4;
      const locationRisk = 20.0;
      const communityBonus = Math.min(20, Math.max(0, newVerificationCount * 4 - newFlagCount * 6));
      const slaDecay = 10.0;

      const newPriorityScore = Math.min(
        100,
        Math.max(
          5,
          Math.round((severityBase * baseRiskWeight + locationRisk + communityBonus + slaDecay))
        )
      );

      // 3. Multi-Condition State Progression (M04 / A07)
      let nextStatus: ReportStatus = report.status;
      let shouldLogCommunityStep = false;

      // If flags exceed confirmations significantly -> Community False Flag rejection
      if (newFlagCount >= 3 && newFlagCount > newVerificationCount) {
        nextStatus = ReportStatus.REJECTED;
      } else if (
        report.status === ReportStatus.AI_TRIAGED &&
        newVerificationCount >= 2
      ) {
        nextStatus = ReportStatus.COMMUNITY_VERIFIED;
        shouldLogCommunityStep = true;
      }

      // Update Report
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          verificationCount: newVerificationCount,
          flagCount: newFlagCount,
          priorityScore: newPriorityScore,
          status: nextStatus,
        },
      });

      // Update AI Analysis explainability JSON
      if (report.aiAnalysis) {
        await tx.aIAnalysis.update({
          where: { reportId },
          data: {
            priorityBreakdown: {
              severityWeight: Number(severityBase.toFixed(1)),
              locationRiskWeight: locationRisk,
              communityConsensusWeight: communityBonus,
              slaDecayWeight: slaDecay,
              formula: `Score = ${severityBase.toFixed(1)} (Sev) + ${locationRisk} (Loc) + ${communityBonus} (Comm: ${newVerificationCount} votes) + ${slaDecay} (SLA) = ${newPriorityScore}/100`,
            },
          },
        });
      }

      // Log Community Gate Step in Workflow if unlocked
      if (shouldLogCommunityStep) {
        await tx.workflowStepLog.create({
          data: {
            reportId,
            stepName: "STEP_3_COMMUNITY_GATE",
            status: WorkflowStepStatus.SUCCESS,
            attemptCount: 1,
            recoveryAction: null,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.userId,
          action: "COMMUNITY_VERIFY",
          entityType: "Report",
          entityId: reportId,
          metadata: {
            voteType,
            verificationCount: newVerificationCount,
            flagCount: newFlagCount,
            newPriorityScore,
            status: nextStatus,
          },
        },
      });

      return updatedReport;
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: updated.id,
        verificationCount: updated.verificationCount,
        flagCount: updated.flagCount,
        priorityScore: updated.priorityScore,
        status: updated.status,
        message:
          voteType === VoteType.CONFIRM
            ? "Your community verification was recorded successfully!"
            : "False report flag recorded.",
      },
    });
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to record verification." },
      },
      { status: 500 }
    );
  }
}
