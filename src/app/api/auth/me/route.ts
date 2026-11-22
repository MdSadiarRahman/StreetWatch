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

  let user: any = null;
  try {
    user = await db.user.findUnique({
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
  } catch {
    // Database offline fallback
    user = {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      departmentId: session.departmentId || null,
      workerCapacity: 3,
      activeTaskCount: session.role === "FIELD_WORKER" ? 3 : 0,
      trustScore: 1.5,
      createdAt: new Date().toISOString(),
    };
  }

  if (!user) {
    user = {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      departmentId: session.departmentId || null,
      workerCapacity: 3,
      activeTaskCount: session.role === "FIELD_WORKER" ? 3 : 0,
      trustScore: 1.5,
      createdAt: new Date().toISOString(),
    };
  }

  return NextResponse.json({
    success: true,
    data: { user },
  });
}
