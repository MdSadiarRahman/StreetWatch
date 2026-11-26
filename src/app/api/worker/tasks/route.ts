import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MOCK_REPORTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "FIELD_WORKER") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Field Worker privileges required." } },
        { status: 403 }
      );
    }

    try {
      const [worker, assignments] = await Promise.all([
        db.user.findUnique({
          where: { id: session.userId },
          include: { department: true },
        }),
        db.assignment.findMany({
          where: { workerId: session.userId },
          orderBy: { assignedAt: "desc" },
          include: {
            report: {
              include: {
                category: true,
                aiAnalysis: true,
              },
            },
          },
        }),
      ]);

      const tasks = assignments.map((a) => ({
        assignmentId: a.id,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt,
        overrideReason: a.overrideReason,
        report: a.report,
      }));

      return NextResponse.json({
        success: true,
        data: {
          worker: {
            id: worker?.id || session.userId,
            name: worker?.name || session.name,
            department: worker?.department?.name || "Electrical & Lighting",
            activeTaskCount: worker?.activeTaskCount || tasks.length,
            workerCapacity: worker?.workerCapacity || 3,
          },
          tasks,
        },
      });
    } catch {
      // Database offline fallback: match assignments for logged-in worker or default 3 tasks for worker-1
      const workerAssigned = MOCK_REPORTS.filter((r) =>
        r.assignments?.some((a) => a.workerId === session.userId)
      );
      const assignedReports =
        workerAssigned.length > 0
          ? workerAssigned
          : [MOCK_REPORTS[0], MOCK_REPORTS[2], MOCK_REPORTS[3]];
      const tasks = assignedReports.map((r, i) => ({
        assignmentId: `asgn-mock-${i + 1}`,
        assignedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        completedAt: r.assignments?.[0]?.completedAt || null,
        overrideReason: null,
        report: r,
      }));

      return NextResponse.json({
        success: true,
        data: {
          worker: {
            id: session.userId,
            name: session.name,
            department:
              assignedReports[0]?.category?.department?.name || "Electrical & Lighting",
            activeTaskCount: tasks.filter((t) => !t.completedAt).length || tasks.length,
            workerCapacity: 3,
          },
          tasks,
        },
      });
    }
  } catch (error) {
    console.error("Worker Tasks Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to load worker tasks." } },
      { status: 500 }
    );
  }
}
