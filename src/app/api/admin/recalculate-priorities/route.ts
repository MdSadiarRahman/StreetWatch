import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { calculateExplainablePriority } from "@/lib/ai/priority-engine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "AUTHORITY") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Authority privileges required." } },
        { status: 403 }
      );
    }

    const activeReports = await db.report.findMany({
      where: {
        status: {
          notIn: ["RESOLVED", "CITIZEN_VERIFIED", "REJECTED"],
        },
      },
      include: {
        category: true,
        aiAnalysis: true,
      },
    });

    const now = Date.now();
    let updatedCount = 0;

    for (const report of activeReports) {
      const ageHours = (now - new Date(report.createdAt).getTime()) / (1000 * 60 * 60);

      const calculated = calculateExplainablePriority({
        severityScore: report.severityScore,
        baseRiskWeight: report.category.baseRiskWeight,
        verificationCount: report.verificationCount,
        flagCount: report.flagCount,
        reportAgeHours: ageHours,
      });

      await db.report.update({
        where: { id: report.id },
        data: {
          priorityScore: calculated.finalScore,
        },
      });

      if (report.aiAnalysis) {
        await db.aIAnalysis.update({
          where: { reportId: report.id },
          data: {
            priorityBreakdown: calculated.breakdown,
          },
        });
      }

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount,
        message: `Successfully recalculated priorities for ${updatedCount} active reports.`,
      },
    });
  } catch (error) {
    console.error("Recalculate Priorities Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to recalculate priorities." } },
      { status: 500 }
    );
  }
}
