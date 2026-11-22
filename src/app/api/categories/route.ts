import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MOCK_CATEGORIES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        department: {
          select: { id: true, name: true, slaHours: true },
        },
      },
      orderBy: { name: "asc" },
    });

    if (categories.length > 0) {
      return NextResponse.json({
        success: true,
        data: { categories },
      });
    }

    return NextResponse.json({
      success: true,
      data: { categories: MOCK_CATEGORIES },
    });
  } catch (error) {
    console.warn("Using fallback categories (database offline):", (error as Error).message);
    return NextResponse.json({
      success: true,
      data: { categories: MOCK_CATEGORIES },
    });
  }
}
