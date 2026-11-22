import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

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
          id: worker?.id,
          name: worker?.name,
          department: worker?.department?.name,
          activeTaskCount: worker?.activeTaskCount || 0,
          workerCapacity: worker?.workerCapacity || 3,
        },
        tasks,
      },
    });
  } catch (error) {
    console.error("Worker Tasks Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to load worker tasks." } },
      { status: 500 }
    );
  }
}
