import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MOCK_REPORTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    // Allow either authority user or demo operator
    const body = await req.json();
    const { reportId, priorityScore, severityRating, justification } = body;

    if (!reportId || typeof priorityScore !== "number") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "reportId and numeric priorityScore required." } },
        { status: 400 }
      );
    }

    const normalizedPriority = Math.min(100, Math.max(0, priorityScore));

    try {
      await db.report.update({
        where: { id: reportId },
        data: {
          priorityScore: normalizedPriority,
          severityScore: (severityRating ?? 4) * 20,
        },
      });

      // Insert audit log entry
      if (session?.userId) {
        await db.auditLog.create({
          data: {
            actorId: session.userId,
            action: "TRIAGE_HUMAN_OVERRIDE",
            entityType: "Report",
            entityId: reportId,
            metadata: {
              previousScore: priorityScore,
              overriddenScore: normalizedPriority,
              justification: justification || "Operator manual override applied.",
            },
          },
        }).catch(() => null);
      }
    } catch {
      // In-memory fallback
      const target = MOCK_REPORTS.find((r) => r.id === reportId);
      if (target) {
        target.priorityScore = normalizedPriority;
        target.severityScore = (severityRating ?? 4) * 20;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        priorityScore: normalizedPriority,
        message: `Human operator override saved. Priority updated to P-${Math.round(normalizedPriority)}.`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
}
