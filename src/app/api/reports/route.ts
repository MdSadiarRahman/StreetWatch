import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createReportSchema } from "@/lib/validations/report";
import { findNearbyDuplicate, analyzeCivicReport } from "@/lib/ai/triage-engine";
import { ReportStatus, WorkflowStepStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in to submit a report." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = createReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid report data",
            details: result.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { title, description, latitude, longitude, address, wardZone, imageUrl } = result.data;
    let categoryId = result.data.categoryId;

    // Run AI Triage & Severity Estimation
    const aiResult = await analyzeCivicReport({
      title,
      description,
      categoryId,
      wardZone,
      imageUrl,
    });

    // If "AUTO", find or map category by slug
    if (categoryId === "AUTO") {
      const matchedCategory = await db.category.findUnique({
        where: { slug: aiResult.detectedCategorySlug },
      });
      if (matchedCategory) {
        categoryId = matchedCategory.id;
      } else {
        const fallbackCat = await db.category.findFirst();
        categoryId = fallbackCat?.id || "";
      }
    }

    // Fetch Category metadata for risk weighting
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    // Check Geospatial Duplicates within 50m
    const duplicateResult = await findNearbyDuplicate(latitude, longitude, categoryId, 50);

    // Calculate initial dynamic priority score
    const riskMultiplier = category?.baseRiskWeight || 1.0;
    const computedPriority = Math.min(
      100,
      Math.max(10, Math.round(aiResult.severityScore * 0.65 * riskMultiplier + 25))
    );

    // Database Transaction: Report + AIAnalysis + WorkflowStepLogs + AuditLog
    const createdReport = await db.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          title,
          description,
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
          latitude,
          longitude,
          address,
          wardZone,
          categoryId,
          reporterId: user.userId,
          status: ReportStatus.AI_TRIAGED,
          severityScore: aiResult.severityScore,
          priorityScore: computedPriority,
          isDuplicate: duplicateResult.isDuplicate,
          parentReportId: duplicateResult.parentReport?.id || null,
          beforeProofUrl: imageUrl || null,
        },
        include: {
          category: true,
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create AI Analysis record (Supports A02 Explainability)
      await tx.aIAnalysis.create({
        data: {
          reportId: report.id,
          detectedCategory: aiResult.detectedCategorySlug,
          confidenceScore: 0.95,
          severityReasoning: aiResult.severityReasoning,
          priorityBreakdown: aiResult.priorityBreakdown,
          recommendedDepartment: aiResult.recommendedDepartment,
          optimizationNote: duplicateResult.isDuplicate
            ? `Flagged as duplicate of Report #${duplicateResult.parentReport?.id?.slice(0, 8)} (${duplicateResult.distanceMeters}m away).`
            : "No spatial duplicates detected within 50m radius.",
        },
      });

      // Initial Workflow Step Logs (Supports A07 Step Tracking)
      await tx.workflowStepLog.createMany({
        data: [
          {
            reportId: report.id,
            stepName: "STEP_1_INGEST",
            status: WorkflowStepStatus.SUCCESS,
            attemptCount: 1,
            recoveryAction: null,
          },
          {
            reportId: report.id,
            stepName: "STEP_2_AI_TRIAGE",
            status: WorkflowStepStatus.SUCCESS,
            attemptCount: 1,
            recoveryAction: null,
          },
        ],
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.userId,
          action: "REPORT_CREATE",
          entityType: "Report",
          entityId: report.id,
          metadata: {
            isDuplicate: duplicateResult.isDuplicate,
            priorityScore: computedPriority,
          },
        },
      });

      return report;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          report: createdReport,
          aiAnalysis: aiResult,
          duplicateInfo: duplicateResult,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Report Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create civic report." },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const wardZone = searchParams.get("wardZone");
    const reporterId = searchParams.get("reporterId");
    const sortBy = searchParams.get("sortBy") || "newest";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};

    if (search && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL") {
      where.categoryId = category;
    }

    if (status && status !== "ALL") {
      where.status = status as ReportStatus;
    }

    if (wardZone && wardZone !== "ALL") {
      where.wardZone = wardZone;
    }

    if (reporterId) {
      where.reporterId = reporterId;
    }

    let orderBy: Prisma.ReportOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "priority") {
      orderBy = { priorityScore: "desc" };
    } else if (sortBy === "verifications") {
      orderBy = { verificationCount: "desc" };
    }

    const [items, total] = await Promise.all([
      db.report.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          reporter: {
            select: { id: true, name: true, email: true },
          },
          aiAnalysis: {
            select: {
              detectedCategory: true,
              confidenceScore: true,
              severityReasoning: true,
              priorityBreakdown: true,
            },
          },
        },
      }),
      db.report.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("List Reports Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to load reports." },
      },
      { status: 500 }
    );
  }
}
