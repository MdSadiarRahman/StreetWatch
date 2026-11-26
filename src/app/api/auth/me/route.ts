import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserRecordById, sanitizeUser } from "@/lib/auth/account-store";

export const dynamic = "force-dynamic";

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

  const user = await getUserRecordById(session.userId);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Session expired or account unavailable.",
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { user: sanitizeUser(user) },
  });
}
