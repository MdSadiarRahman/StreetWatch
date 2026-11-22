import { db } from "@/lib/db";
import { ReportStatus, WorkflowStepStatus } from "@prisma/client";

export const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  REPORTED: [ReportStatus.AI_TRIAGED, ReportStatus.REJECTED],
  AI_TRIAGED: [
    ReportStatus.COMMUNITY_VERIFIED,
    ReportStatus.PRIORITY_SCORED,
    ReportStatus.REJECTED,
  ],
  COMMUNITY_VERIFIED: [
    ReportStatus.PRIORITY_SCORED,
    ReportStatus.ASSIGNED,
    ReportStatus.REJECTED,
  ],
  PRIORITY_SCORED: [ReportStatus.ASSIGNED, ReportStatus.REJECTED],
  ASSIGNED: [ReportStatus.IN_PROGRESS, ReportStatus.FAILED_RECOVERY],
  IN_PROGRESS: [ReportStatus.RESOLVED, ReportStatus.FAILED_RECOVERY],
  FAILED_RECOVERY: [
    ReportStatus.ASSIGNED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.PRIORITY_SCORED,
  ],
  RESOLVED: [ReportStatus.CITIZEN_VERIFIED, ReportStatus.IN_PROGRESS],
  CITIZEN_VERIFIED: [],
  REJECTED: [],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export async function simulateStepFailure(params: {
  reportId: string;
  failedStepName?: string;
  reason?: string;
  actorId?: string;
}) {
  const {
    reportId,
    failedStepName = "STEP_5_DISPATCH",
    reason = "Worker inactivity timeout (45m threshold breached without field acceptance).",
    actorId,
  } = params;

  return await db.$transaction(async (tx) => {
    const report = await tx.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error("Report not found.");
    }

    // 1. Record the failed step in WorkflowStepLog (A07)
    const failedLog = await tx.workflowStepLog.create({
      data: {
        reportId,
        stepName: failedStepName,
        status: WorkflowStepStatus.FAILED,
        attemptCount: 1,
        errorMessage: reason,
        recoveryAction: "Pending automated recovery evaluation",
      },
    });

    // 2. Transition Report to FAILED_RECOVERY state
    const updatedReport = await tx.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.FAILED_RECOVERY,
      },
    });

    // 3. Record Audit Log
    await tx.auditLog.create({
      data: {
        actorId: actorId || null,
        action: "WORKFLOW_SIMULATE_FAILURE",
        entityType: "Report",
        entityId: reportId,
        metadata: {
          simulatedStep: failedStepName,
          reason,
          previousStatus: report.status,
          newStatus: ReportStatus.FAILED_RECOVERY,
        },
      },
    });

    return {
      report: updatedReport,
      failedLog,
      message: `Simulated failure recorded for ${failedStepName}. Workflow moved to FAILED_RECOVERY.`,
    };
  });
}

export async function recoverWorkflow(params: {
  reportId: string;
  actorId?: string;
}) {
  const { reportId, actorId } = params;

  return await db.$transaction(async (tx) => {
    const report = await tx.report.findUnique({
      where: { id: reportId },
      include: {
        assignments: {
          where: { completedAt: null },
          orderBy: { assignedAt: "desc" },
          take: 1,
          include: { worker: true },
        },
        workflowStepLogs: {
          orderBy: { executedAt: "desc" },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found.");
    }

    const lastFailedLog = report.workflowStepLogs.find(
      (l) => l.status === WorkflowStepStatus.FAILED
    );

    const activeAssignment = report.assignments[0];

    // Strategy 1: Automatic Retry if attempt count < 2
    if (lastFailedLog && lastFailedLog.attemptCount < 2) {
      const updatedLog = await tx.workflowStepLog.create({
        data: {
          reportId,
          stepName: lastFailedLog.stepName,
          status: WorkflowStepStatus.RETRIED,
          attemptCount: lastFailedLog.attemptCount + 1,
          errorMessage: null,
          recoveryAction: "Automatic retry strategy executed successfully.",
        },
      });

      // Restore report state back to ASSIGNED or IN_PROGRESS
      const restoredStatus = activeAssignment
        ? ReportStatus.ASSIGNED
        : ReportStatus.PRIORITY_SCORED;

      const restoredReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: restoredStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId || null,
          action: "WORKFLOW_AUTO_RETRY",
          entityType: "Report",
          entityId: reportId,
          metadata: {
            stepName: lastFailedLog.stepName,
            attemptCount: updatedLog.attemptCount,
            restoredStatus,
          },
        },
      });

      return {
        strategy: "AUTO_RETRY",
        report: restoredReport,
        stepLog: updatedLog,
        message: `Step ${lastFailedLog.stepName} retried successfully. State restored to ${restoredStatus}.`,
      };
    }

    // Strategy 2: Safe Rollback & Escalation (A07)
    // Revoke stuck worker lock, roll back state to PRIORITY_SCORED, boost urgency (+10), and re-enqueue
    if (activeAssignment) {
      // Free the stuck worker
      await tx.user.update({
        where: { id: activeAssignment.workerId },
        data: {
          activeTaskCount: {
            decrement: Math.min(1, activeAssignment.worker.activeTaskCount),
          },
        },
      });

      await tx.assignment.update({
        where: { id: activeAssignment.id },
        data: {
          completedAt: new Date(),
          overrideReason: "A07 Automatic Recovery: Lock revoked due to failure.",
        },
      });
    }

    const escalatedScore = Math.min(100, report.priorityScore + 10);

    const rolledBackReport = await tx.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.PRIORITY_SCORED,
        priorityScore: escalatedScore,
      },
    });

    const recoveryLog = await tx.workflowStepLog.create({
      data: {
        reportId,
        stepName: "STEP_5_DISPATCH",
        status: WorkflowStepStatus.ROLLED_BACK,
        attemptCount: 2,
        errorMessage: "Unresponsive worker lock revoked.",
        recoveryAction: "State safely rolled back to PRIORITY_SCORED with +10 SLA urgency escalation.",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actorId || null,
        action: "WORKFLOW_ROLLBACK_ESCALATE",
        entityType: "Report",
        entityId: reportId,
        metadata: {
          previousWorkerId: activeAssignment?.workerId,
          escalatedPriority: escalatedScore,
          newStatus: ReportStatus.PRIORITY_SCORED,
        },
      },
    });

    return {
      strategy: "ROLLBACK_AND_ESCALATE",
      report: rolledBackReport,
      stepLog: recoveryLog,
      message:
        "Worker lock revoked and ticket rolled back to PRIORITY_SCORED with +10 urgency escalation. Ready for optimal re-dispatch.",
    };
  });
}
