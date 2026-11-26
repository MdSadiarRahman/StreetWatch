import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/auth/security";
import { recordAuthAuditLog } from "@/lib/auth/account-store";

export async function POST(req: NextRequest) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Invalid request origin." } },
      { status: 403 }
    );
  }

  const session = await getCurrentUser().catch(() => null);
  await clearSessionCookie();

  if (session) {
    await recordAuthAuditLog(session.userId, "USER_LOGOUT", session.userId);
  }

  return NextResponse.json({
    success: true,
    message: "Signed out successfully.",
  });
}
