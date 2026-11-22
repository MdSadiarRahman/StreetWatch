import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { Report } from "@prisma/client";
import { MOCK_REPORTS } from "@/lib/mock-data";

export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  parentReport: Report | null;
  distanceMeters: number | null;
}

export async function findNearbyDuplicate(
  latitude: number,
  longitude: number,
  categoryId?: string,
  maxDistanceMeters = 50
): Promise<DuplicateCheckResult> {
  // Query active (non-resolved, non-rejected) reports within roughly ~0.01 deg bounding box
  const delta = 0.01;
  let candidateReports: any[] = [];

  try {
    candidateReports = await db.report.findMany({
      where: {
        status: {
          notIn: ["RESOLVED", "CITIZEN_VERIFIED", "REJECTED"],
        },
        latitude: {
          gte: latitude - delta,
          lte: latitude + delta,
        },
        longitude: {
          gte: longitude - delta,
          lte: longitude + delta,
        },
      },
      include: {
        category: true,
      },
    });
  } catch {
    candidateReports = MOCK_REPORTS.filter(
      (r) => !["RESOLVED", "CITIZEN_VERIFIED", "REJECTED"].includes(r.status)
    );
  }

  let closestReport: Report | null = null;
  let minDistance = Infinity;

  for (const report of candidateReports) {
    const dist = calculateHaversineDistanceMeters(
      latitude,
      longitude,
      report.latitude,
      report.longitude
    );

    if (dist <= maxDistanceMeters) {
      // If categoryId is specified, check matching category or broad relevance
      const isCategoryMatch = !categoryId || categoryId === "AUTO" || report.categoryId === categoryId;
      if (isCategoryMatch && dist < minDistance) {
        minDistance = dist;
        closestReport = report;
      }
    }
  }

  return {
    isDuplicate: closestReport !== null,
    parentReport: closestReport,
    distanceMeters: closestReport ? minDistance : null,
  };
}

export interface AIAnalysisOutput {
  detectedCategorySlug: string;
  severityScore: number;
  severityReasoning: string;
  recommendedDepartment: string;
  priorityBreakdown: {
    severityWeight: number;
    locationRiskWeight: number;
    communityConsensusWeight: number;
    slaDecayWeight: number;
    formula: string;
  };
}

export async function analyzeCivicReport(params: {
  title: string;
  description: string;
  categoryId?: string;
  wardZone: string;
  imageUrl?: string;
}): Promise<AIAnalysisOutput> {
  const { title, description, categoryId, wardZone } = params;
  const textCombined = `${title} ${description}`.toLowerCase();

  // Try Gemini AI if API Key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are the StreetWatch AI Civic Triage Engine. Analyze the following civic report:
Title: "${title}"
Description: "${description}"
Ward/Zone: "${wardZone}"

Return a valid JSON object ONLY with these fields:
- detectedCategorySlug: one of ["exposed-live-wire", "open-manhole", "deep-pothole", "severe-waterlogging", "broken-streetlight", "garbage-overflow"]
- severityScore: number between 10 and 95 (higher for life-threatening electrical/manhole issues, lower for minor litter or aesthetic issues)
- severityReasoning: 1-2 concise sentences explaining the hazard and public safety risk
- recommendedDepartment: one of ["Electrical & Lighting", "Water & Drainage", "Roads & Highways", "Waste & Sanitation"]

JSON:`;

      const aiPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini AI timeout")), 5000)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      const responseText = response.response.text();
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const severityScore = Math.min(Math.max(Number(parsed.severityScore) || 50, 10), 95);
      const severityWeight = Number((severityScore * 0.4).toFixed(1));
      const locationRiskWeight = 20.0;
      const communityConsensusWeight = 5.0;
      const slaDecayWeight = 5.0;
      const totalScore = Number(
        (severityWeight + locationRiskWeight + communityConsensusWeight + slaDecayWeight).toFixed(1)
      );

      return {
        detectedCategorySlug: parsed.detectedCategorySlug || "deep-pothole",
        severityScore,
        severityReasoning: parsed.severityReasoning || "AI verified civic infrastructure hazard.",
        recommendedDepartment: parsed.recommendedDepartment || "Roads & Highways",
        priorityBreakdown: {
          severityWeight,
          locationRiskWeight,
          communityConsensusWeight,
          slaDecayWeight,
          formula: `Initial Score = ${severityWeight} (Sev) + ${locationRiskWeight} (Loc) + ${communityConsensusWeight} (Comm) + ${slaDecayWeight} (SLA) = ${totalScore}/100`,
        },
      };
    } catch (err) {
      console.warn("Gemini AI call failed or timed out. Using deterministic fallback engine:", err);
    }
  }

  // Deterministic Fallback Engine (Guarantees 100% uptime for hackathon demo & offline testing)
  let detectedCategorySlug = "deep-pothole";
  let recommendedDepartment = "Roads & Highways";
  let severityScore = 60;
  let severityReasoning = "Moderate civic maintenance requirement.";

  if (
    textCombined.includes("wire") ||
    textCombined.includes("electric") ||
    textCombined.includes("shock") ||
    textCombined.includes("spark") ||
    textCombined.includes("cable")
  ) {
    detectedCategorySlug = "exposed-live-wire";
    recommendedDepartment = "Electrical & Lighting";
    severityScore = 95;
    severityReasoning =
      "Critical hazard: Exposed electrical lines pose immediate electrocution and fire risk to pedestrians.";
  } else if (
    textCombined.includes("manhole") ||
    textCombined.includes("sewer") ||
    textCombined.includes("drain lid") ||
    textCombined.includes("open drain")
  ) {
    detectedCategorySlug = "open-manhole";
    recommendedDepartment = "Water & Drainage";
    severityScore = 92;
    severityReasoning =
      "High urgency: Open manholes present severe fall and injury danger for pedestrians and vehicles.";
  } else if (
    textCombined.includes("flood") ||
    textCombined.includes("waterlog") ||
    textCombined.includes("drainage") ||
    textCombined.includes("submerged")
  ) {
    detectedCategorySlug = "severe-waterlogging";
    recommendedDepartment = "Water & Drainage";
    severityScore = 75;
    severityReasoning =
      "Substantial water accumulation impeding local transport and public health.";
  } else if (
    textCombined.includes("garbage") ||
    textCombined.includes("waste") ||
    textCombined.includes("trash") ||
    textCombined.includes("dump")
  ) {
    detectedCategorySlug = "garbage-overflow";
    recommendedDepartment = "Waste & Sanitation";
    severityScore = 55;
    severityReasoning =
      "Sanitation overflow affecting urban hygiene and pedestrian right-of-way.";
  } else if (
    textCombined.includes("light") ||
    textCombined.includes("lamp") ||
    textCombined.includes("dark")
  ) {
    detectedCategorySlug = "broken-streetlight";
    recommendedDepartment = "Electrical & Lighting";
    severityScore = 50;
    severityReasoning =
      "Non-functional street lighting causing safety and visibility dark spots.";
  } else {
    // Default pothole / road hazard
    detectedCategorySlug = "deep-pothole";
    recommendedDepartment = "Roads & Highways";
    severityScore = 70;
    severityReasoning =
      "Road surface defect causing vehicular hazard and traffic disruption.";
  }

  const severityWeight = Number((severityScore * 0.4).toFixed(1));
  const locationRiskWeight = 20.0;
  const communityConsensusWeight = 5.0;
  const slaDecayWeight = 5.0;
  const totalScore = Number(
    (severityWeight + locationRiskWeight + communityConsensusWeight + slaDecayWeight).toFixed(1)
  );

  return {
    detectedCategorySlug,
    severityScore,
    severityReasoning,
    recommendedDepartment,
    priorityBreakdown: {
      severityWeight,
      locationRiskWeight,
      communityConsensusWeight,
      slaDecayWeight,
      formula: `Initial Score = ${severityWeight} (Sev) + ${locationRiskWeight} (Loc) + ${communityConsensusWeight} (Comm) + ${slaDecayWeight} (SLA) = ${totalScore}/100`,
    },
  };
}
