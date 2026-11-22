import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [reports, departments, workers, categories, recentWorkflowLogs] = await Promise.all([
      db.report.findMany({
        include: {
          category: {
            select: { id: true, name: true, departmentId: true, baseRiskWeight: true },
          },
        },
      }),
      db.department.findMany({
        include: {
          users: {
            where: { role: "FIELD_WORKER" },
            select: { id: true, name: true, activeTaskCount: true, workerCapacity: true },
          },
        },
      }),
      db.user.findMany({
        where: { role: "FIELD_WORKER" },
        select: { id: true, name: true, activeTaskCount: true, workerCapacity: true, departmentId: true },
      }),
      db.category.findMany({
        select: { id: true, name: true, baseRiskWeight: true },
      }),
      db.workflowStepLog.findMany({
        orderBy: { executedAt: "desc" },
        take: 8,
        include: {
          report: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
    ]);

    const totalReports = reports.length;
    const resolvedReports = reports.filter(
      (r) => r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED"
    );
    const resolvedCount = resolvedReports.length;
    const resolutionRatePercent =
      totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

    const criticalUnassignedCount = reports.filter(
      (r) =>
        r.priorityScore >= 80 &&
        ["REPORTED", "AI_TRIAGED", "COMMUNITY_VERIFIED", "PRIORITY_SCORED"].includes(r.status)
    ).length;

    const avgPriorityScore =
      totalReports > 0
        ? Math.round(reports.reduce((acc, r) => acc + r.priorityScore, 0) / totalReports)
        : 0;

    // Workforce Capacity stats
    const totalSlots = workers.reduce((acc, w) => acc + w.workerCapacity, 0);
    const activeSlots = workers.reduce((acc, w) => acc + w.activeTaskCount, 0);

    // Department Stats
    const departmentStats = departments.map((dept) => {
      const deptWorkers = dept.users;
      const deptTotalCap = deptWorkers.reduce((acc, w) => acc + w.workerCapacity, 0);
      const deptActiveLoad = deptWorkers.reduce((acc, w) => acc + w.activeTaskCount, 0);
      const deptOpenReports = reports.filter(
        (r) =>
          r.category.departmentId === dept.id &&
          !["RESOLVED", "CITIZEN_VERIFIED", "REJECTED"].includes(r.status)
      ).length;

      return {
        id: dept.id,
        name: dept.name,
        slaHours: dept.slaHours,
        workerCount: deptWorkers.length,
        totalCapacity: deptTotalCap,
        activeLoad: deptActiveLoad,
        isSaturated: deptTotalCap > 0 && deptActiveLoad >= deptTotalCap,
        openReports: deptOpenReports,
        workers: deptWorkers,
      };
    });

    // Ward Hotspots
    const wardMap: Record<string, { openCount: number; criticalCount: number }> = {};
    for (const r of reports) {
      if (["RESOLVED", "CITIZEN_VERIFIED", "REJECTED"].includes(r.status)) continue;
      if (!wardMap[r.wardZone]) {
        wardMap[r.wardZone] = { openCount: 0, criticalCount: 0 };
      }
      wardMap[r.wardZone].openCount += 1;
      if (r.priorityScore >= 80) {
        wardMap[r.wardZone].criticalCount += 1;
      }
    }

    const wardHotspots = Object.entries(wardMap)
      .map(([ward, data]) => ({
        wardZone: ward,
        openCount: data.openCount,
        criticalCount: data.criticalCount,
        riskLevel: data.criticalCount >= 2 ? "CRITICAL" : data.openCount >= 3 ? "HIGH" : "MEDIUM",
      }))
      .sort((a, b) => b.openCount - a.openCount);

    return NextResponse.json({
      success: true,
      data: {
        totalReports,
        criticalUnassignedCount,
        resolvedCount,
        resolutionRatePercent,
        avgPriorityScore,
        workforceCapacity: {
          totalSlots,
          activeSlots,
          utilizationPercent: totalSlots > 0 ? Math.round((activeSlots / totalSlots) * 100) : 0,
        },
        departmentStats,
        wardHotspots,
        recentWorkflowLogs,
      },
    });
  } catch (error) {
    console.error("Analytics Summary Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to generate analytics." } },
      { status: 500 }
    );
  }
}
