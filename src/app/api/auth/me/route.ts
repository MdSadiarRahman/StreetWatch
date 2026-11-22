import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No active session found.",
        },
      },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      workerCapacity: true,
      activeTaskCount: true,
      trustScore: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User account no longer exists.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { user },
  });
}
