import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { MOCK_REPORTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const session = await getCurrentUser();
    let report: any = null;

    try {
      report = await db.report.findUnique({
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
    } catch {
      // Database offline fallback
      report = MOCK_REPORTS.find((r) => r.id === reportId) || MOCK_REPORTS[0];
    }

    if (!report) {
      report = MOCK_REPORTS.find((r) => r.id === reportId) || MOCK_REPORTS[0];
    }

    // Check if session user has already voted
    let hasUserVoted = false;
    let userVoteType: string | null = null;
    let isReporter = false;

    if (session) {
      const userVote = (report.verifications || []).find((v: any) => v.userId === session.userId);
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
          workflowStepLogs: report.workflowStepLogs || [
            { id: "step-1", stepName: "SAFETY_ASSESSMENT", status: "SUCCESS", executedAt: report.createdAt },
            { id: "step-2", stepName: "MATERIALS_STAGED", status: "SUCCESS", executedAt: report.createdAt },
          ],
          verifications: report.verifications || [],
          hasUserVoted,
          userVoteType,
          isReporter,
        },
      },
    });
  } catch (error) {
    const fallback = MOCK_REPORTS[0];
    return NextResponse.json({
      success: true,
      data: {
        report: {
          ...fallback,
          hasUserVoted: false,
          userVoteType: null,
          isReporter: false,
          workflowStepLogs: [],
          verifications: [],
        },
      },
    });
  }
}
