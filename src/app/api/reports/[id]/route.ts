import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const session = await getCurrentUser();

    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        category: {
          include: {
            department: {
              select: { id: true, name: true, slaHours: true },
            },
          },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
        aiAnalysis: true,
        assignments: {
          orderBy: { assignedAt: "desc" },
          take: 1,
          include: {
            worker: {
              select: { id: true, name: true, role: true, departmentId: true },
            },
          },
        },
        workflowStepLogs: {
          orderBy: { executedAt: "asc" },
        },
        verifications: {
          select: {
            id: true,
            userId: true,
            voteType: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Report not found." } },
        { status: 404 }
      );
    }

    // Check if session user has already voted
    let hasUserVoted = false;
    let userVoteType: string | null = null;
    let isReporter = false;

    if (session) {
      const userVote = report.verifications.find((v) => v.userId === session.userId);
      if (userVote) {
        hasUserVoted = true;
        userVoteType = userVote.voteType;
      }
      isReporter = report.reporterId === session.userId;
    }

    return NextResponse.json({
      success: true,
      data: {
        report: {
          ...report,
          hasUserVoted,
          userVoteType,
          isReporter,
        },
      },
    });
  } catch (error) {
    console.error("Fetch Report Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to load report details." },
      },
      { status: 500 }
    );
  }
}
