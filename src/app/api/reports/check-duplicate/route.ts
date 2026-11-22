import { NextRequest, NextResponse } from "next/server";
import { findNearbyDuplicate } from "@/lib/ai/triage-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const categoryId = searchParams.get("categoryId") || undefined;

    if (!latStr || !lngStr) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "lat and lng query parameters are required." },
        },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Invalid latitude or longitude values." },
        },
        { status: 400 }
      );
    }

    const duplicateResult = await findNearbyDuplicate(lat, lng, categoryId, 50);

    return NextResponse.json({
      success: true,
      data: duplicateResult,
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Error performing duplicate check." },
      },
      { status: 500 }
    );
  }
}
