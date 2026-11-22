import { db } from "@/lib/db";
import { ReportStatus, WorkflowStepStatus } from "@prisma/client";

export interface PriorityCalculationResult {
  finalScore: number;
  breakdown: {
    severityComponent: number;
    riskMultiplierComponent: number;
    communityTrustComponent: number;
    urgencyAgingComponent: number;
    formula: string;
  };
  explanation: string;
}

export function calculateExplainablePriority(params: {
  severityScore: number;
  baseRiskWeight?: number;
  verificationCount: number;
  flagCount: number;
  reportAgeHours: number;
  departmentLoadRatio?: number;
}): PriorityCalculationResult {
  const {
    severityScore,
    baseRiskWeight = 1.0,
    verificationCount,
    flagCount,
    reportAgeHours,
  } = params;

  // 1. Severity component (up to 40 pts)
  const severityComponent = Number(((severityScore / 100) * 40).toFixed(1));

  // 2. Base Category Risk multiplier component (up to 25 pts)
  const riskMultiplierComponent = Number(
    Math.min(25, 15 * baseRiskWeight).toFixed(1)
  );

  // 3. Community Trust / Consensus component (up to 20 pts, penalized by flags)
  const rawCommunity = verificationCount * 4 - flagCount * 6;
  const communityTrustComponent = Number(
    Math.max(0, Math.min(20, rawCommunity)).toFixed(1)
  );

  // 4. Urgency aging decay component (up to 15 pts based on hours open)
  // Increases by 1.5 pts every 6 hours, capped at 15
  const urgencyAgingComponent = Number(
    Math.min(15, Math.floor(reportAgeHours / 6) * 1.5 + 2).toFixed(1)
  );

  const rawTotal =
    severityComponent +
    riskMultiplierComponent +
    communityTrustComponent +
    urgencyAgingComponent;

  const finalScore = Math.min(100, Math.max(5, Math.round(rawTotal)));

  const formula = `Score = ${severityComponent} (Sev) + ${riskMultiplierComponent} (Risk) + ${communityTrustComponent} (Votes: +${verificationCount}/-${flagCount}) + ${urgencyAgingComponent} (Aging: ${Math.round(reportAgeHours)}h) = ${finalScore}/100`;

  let explanation = "Standard civic hazard evaluation.";
  if (finalScore >= 85) {
    explanation = "Critical Emergency: Immediate public safety hazard requiring rapid crew dispatch.";
  } else if (finalScore >= 70) {
    explanation = "High Priority: Elevated civic defect with confirmed community consensus.";
  } else if (finalScore >= 50) {
    explanation = "Medium Priority: Routine maintenance queue subject to departmental SLA.";
  }

  return {
    finalScore,
    breakdown: {
      severityComponent,
      riskMultiplierComponent,
      communityTrustComponent,
      urgencyAgingComponent,
      formula,
    },
    explanation,
  };
}

export type ResolutionStrategy =
  | "STRICT"
  | "CROSS_ZONE_FALLBACK"
  | "PREEMPT_LOW_PRIORITY";

export interface FallbackOption {
  strategy: ResolutionStrategy;
  label: string;
  recommendedWorkerId?: string;
  recommendedWorkerName?: string;
  departmentName?: string;
  targetWorkerId?: string;
  preemptedReportId?: string;
  preemptedReportTitle?: string;
  tradeoffExplanation: string;
}

export interface OptimizationResult {
  status: "ASSIGNED" | "CONFLICT_DETECTED";
  worker?: {
    id: string;
    name: string;
    departmentName: string;
    currentLoad: number;
    maxCapacity: number;
  };
  strategy?: ResolutionStrategy;
  overrideReason?: string;
  conflictReason?: string;
  reportPriority?: number;
  fallbackOptions?: FallbackOption[];
  message: string;
}

export async function optimizeWorkerAssignment(params: {
  reportId: string;
  resolutionStrategy?: ResolutionStrategy;
  assignedById: string;
  manualWorkerId?: string;
}): Promise<OptimizationResult> {
  const {
    reportId,
    resolutionStrategy = "STRICT",
    assignedById,
    manualWorkerId,
  } = params;

  // 1. Fetch Report & Department requirements
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      category: {
        include: {
          department: true,
        },
      },
      aiAnalysis: true,
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  const departmentId = report.category.departmentId;
  const departmentName = report.category.department.name;

  // Manual worker override if requested
  if (manualWorkerId) {
    const worker = await db.user.findUnique({ where: { id: manualWorkerId } });
    if (!worker || worker.role !== "FIELD_WORKER") {
      throw new Error("Specified worker is invalid.");
    }

    return await executeAssignment({
      reportId,
      workerId: worker.id,
      workerName: worker.name,
      departmentName: departmentName,
      assignedById,
      strategy: "STRICT",
      overrideReason: "Manual Administrative Override",
    });
  }

  // Step A: Primary Constraint Check - Find workers in target department with capacity
  const deptWorkers = await db.user.findMany({
    where: {
      role: "FIELD_WORKER",
      departmentId: departmentId,
    },
    orderBy: {
      activeTaskCount: "asc", // Pick worker with lowest current load
    },
  });

  const availableWorker = deptWorkers.find(
    (w) => w.activeTaskCount < w.workerCapacity
  );

  // If optimal worker is available under normal constraints -> Assign immediately!
  if (availableWorker) {
    return await executeAssignment({
      reportId,
      workerId: availableWorker.id,
      workerName: availableWorker.name,
      departmentName: departmentName,
      assignedById,
      strategy: "STRICT",
      overrideReason: null,
    });
  }

  // Step B: Conflicting Constraint / Infeasible Request Handling (Challenge A02)
  // Target department is at 100% capacity!
  const totalSlots = deptWorkers.reduce((acc, w) => acc + w.workerCapacity, 0);
  const activeSlots = deptWorkers.reduce((acc, w) => acc + w.activeTaskCount, 0);

  const conflictReason = `All ${deptWorkers.length} field workers in ${departmentName} are currently at 100% capacity (${activeSlots}/${totalSlots} active tasks).`;

  // Strategy 1: Find Cross-Zone / Cross-Department worker with spare capacity
  const crossZoneWorkers = await db.user.findMany({
    where: {
      role: "FIELD_WORKER",
      departmentId: { not: departmentId },
    },
    include: {
      department: true,
    },
    orderBy: {
      activeTaskCount: "asc",
    },
  });

  const eligibleCrossWorker = crossZoneWorkers.find(
    (w) => w.activeTaskCount < w.workerCapacity
  );

  // Strategy 2: Find lowest priority active task in the saturated department to preempt
  const activeTasksInDept = await db.report.findMany({
    where: {
      categoryId: { in: (await db.category.findMany({ where: { departmentId }, select: { id: true } })).map((c) => c.id) },
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    },
    include: {
      assignments: {
        where: { completedAt: null },
        include: { worker: true },
      },
    },
    orderBy: {
      priorityScore: "asc", // lowest priority first
    },
    take: 1,
  });

  const preemptCandidate = activeTasksInDept[0];
  const preemptWorker = preemptCandidate?.assignments[0]?.worker;

  // If user requested STRICT mode -> Return structured Conflict Analysis with actionable options
  if (resolutionStrategy === "STRICT") {
    const fallbackOptions: FallbackOption[] = [];

    if (eligibleCrossWorker) {
      fallbackOptions.push({
        strategy: "CROSS_ZONE_FALLBACK",
        label: `Reallocate Crew from ${eligibleCrossWorker.department?.name || "Other Dept"}`,
        recommendedWorkerId: eligibleCrossWorker.id,
        recommendedWorkerName: eligibleCrossWorker.name,
        departmentName: eligibleCrossWorker.department?.name,
        tradeoffExplanation: `Dispatches ${eligibleCrossWorker.name} (${eligibleCrossWorker.department?.name}, Load: ${eligibleCrossWorker.activeTaskCount}/${eligibleCrossWorker.workerCapacity}). Solves immediate safety emergency without exceeding crew capacity.`,
      });
    }

    if (preemptCandidate && preemptWorker) {
      fallbackOptions.push({
        strategy: "PREEMPT_LOW_PRIORITY",
        label: `Preempt Lower-Priority Task (${Math.round(preemptCandidate.priorityScore)}/100)`,
        targetWorkerId: preemptWorker.id,
        preemptedReportId: preemptCandidate.id,
        preemptedReportTitle: preemptCandidate.title,
        tradeoffExplanation: `Pauses task "${preemptCandidate.title.slice(0, 30)}..." (Priority: ${Math.round(preemptCandidate.priorityScore)}/100) on ${preemptWorker.name} to free 1 immediate slot for this urgent issue (${Math.round(report.priorityScore)}/100).`,
      });
    }

    return {
      status: "CONFLICT_DETECTED",
      conflictReason,
      reportPriority: Math.round(report.priorityScore),
      fallbackOptions,
      message: "Worker capacity saturated in target department. Choose an AI fallback strategy.",
    };
  }

  // Execute Fallback Strategy: CROSS_ZONE_FALLBACK
  if (resolutionStrategy === "CROSS_ZONE_FALLBACK" && eligibleCrossWorker) {
    return await executeAssignment({
      reportId,
      workerId: eligibleCrossWorker.id,
      workerName: eligibleCrossWorker.name,
      departmentName: eligibleCrossWorker.department?.name || "Secondary Department",
      assignedById,
      strategy: "CROSS_ZONE_FALLBACK",
      overrideReason: `A02 Constraint Resolution: Cross-department dispatch from ${eligibleCrossWorker.department?.name}. Primary department (${departmentName}) was saturated at 100% capacity.`,
    });
  }

  // Execute Fallback Strategy: PREEMPT_LOW_PRIORITY
  if (resolutionStrategy === "PREEMPT_LOW_PRIORITY" && preemptCandidate && preemptWorker) {
    return await db.$transaction(async (tx) => {
      // 1. Pause / Preempt the low-priority task
      await tx.report.update({
        where: { id: preemptCandidate.id },
        data: {
          status: ReportStatus.PRIORITY_SCORED,
        },
      });

      // 2. Mark old assignment completed/preempted
      await tx.assignment.updateMany({
        where: { reportId: preemptCandidate.id, completedAt: null },
        data: {
          completedAt: new Date(),
          overrideReason: `Preempted by higher-priority Critical Report #${report.id.slice(0, 8)}`,
        },
      });

      // 3. Log preemption step log
      await tx.workflowStepLog.create({
        data: {
          reportId: preemptCandidate.id,
          stepName: "STEP_5_DISPATCH",
          status: WorkflowStepStatus.ROLLED_BACK,
          attemptCount: 1,
          recoveryAction: `Preempted to free capacity for Report #${report.id.slice(0, 8)}`,
        },
      });

      // 4. Assign the high-priority report to the preempted worker
      await tx.assignment.create({
        data: {
          reportId,
          workerId: preemptWorker.id,
          assignedById,
          isAutoAssigned: true,
          overrideReason: `A02 Preemption: Worker freed by pausing lower-priority task "${preemptCandidate.title.slice(0, 30)}..."`,
        },
      });

      await tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.ASSIGNED,
        },
      });

      await tx.workflowStepLog.createMany({
        data: [
          {
            reportId,
            stepName: "STEP_4_PRIORITY_OPTIMIZE",
            status: WorkflowStepStatus.SUCCESS,
            attemptCount: 1,
            recoveryAction: "Preemption optimization executed",
          },
          {
            reportId,
            stepName: "STEP_5_DISPATCH",
            status: WorkflowStepStatus.SUCCESS,
            attemptCount: 1,
          },
        ],
      });

      await tx.auditLog.create({
        data: {
          actorId: assignedById,
          action: "A02_PREEMPTION_ASSIGN",
          entityType: "Report",
          entityId: reportId,
          metadata: {
            preemptedReportId: preemptCandidate.id,
            workerId: preemptWorker.id,
          },
        },
      });

      return {
        status: "ASSIGNED",
        worker: {
          id: preemptWorker.id,
          name: preemptWorker.name,
          departmentName: departmentName,
          currentLoad: preemptWorker.activeTaskCount,
          maxCapacity: preemptWorker.workerCapacity,
        },
        strategy: "PREEMPT_LOW_PRIORITY",
        overrideReason: `Preempted task "${preemptCandidate.title.slice(0, 30)}..." to accommodate this emergency.`,
        message: `Task successfully assigned to ${preemptWorker.name} via AI Preemption.`,
      };
    });
  }

  // Fallback if no strategy matched
  throw new Error("Unable to resolve capacity constraints with the selected strategy.");
}

async function executeAssignment(params: {
  reportId: string;
  workerId: string;
  workerName: string;
  departmentName: string;
  assignedById: string;
  strategy: ResolutionStrategy;
  overrideReason: string | null;
}): Promise<OptimizationResult> {
  const {
    reportId,
    workerId,
    workerName,
    departmentName,
    assignedById,
    strategy,
    overrideReason,
  } = params;

  return await db.$transaction(async (tx) => {
    // 1. Create Assignment
    await tx.assignment.create({
      data: {
        reportId,
        workerId,
        assignedById,
        isAutoAssigned: true,
        overrideReason,
      },
    });

    // 2. Increment worker active tasks
    const updatedWorker = await tx.user.update({
      where: { id: workerId },
      data: {
        activeTaskCount: { increment: 1 },
      },
    });

    // 3. Update Report state to ASSIGNED
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.ASSIGNED,
      },
    });

    // 4. Update AI Analysis note
    await tx.aIAnalysis.updateMany({
      where: { reportId },
      data: {
        recommendedDepartment: departmentName,
        optimizationNote: overrideReason || `Optimal assignment: Dispatched to ${workerName} (Load: ${updatedWorker.activeTaskCount}/${updatedWorker.workerCapacity}).`,
      },
    });

    // 5. Append Workflow Step Logs (A07)
    await tx.workflowStepLog.createMany({
      data: [
        {
          reportId,
          stepName: "STEP_4_PRIORITY_OPTIMIZE",
          status: WorkflowStepStatus.SUCCESS,
          attemptCount: 1,
          recoveryAction: null,
        },
        {
          reportId,
          stepName: "STEP_5_DISPATCH",
          status: WorkflowStepStatus.SUCCESS,
          attemptCount: 1,
          recoveryAction: null,
        },
      ],
    });

    // 6. Record Audit Log
    await tx.auditLog.create({
      data: {
        actorId: assignedById,
        action: "A02_WORKER_DISPATCH",
        entityType: "Report",
        entityId: reportId,
        metadata: {
          workerId,
          strategy,
          overrideReason,
        },
      },
    });

    return {
      status: "ASSIGNED",
      worker: {
        id: updatedWorker.id,
        name: updatedWorker.name,
        departmentName,
        currentLoad: updatedWorker.activeTaskCount,
        maxCapacity: updatedWorker.workerCapacity,
      },
      strategy,
      overrideReason: overrideReason || undefined,
      message: `Successfully dispatched to ${workerName} (${departmentName}).`,
    };
  });
}
