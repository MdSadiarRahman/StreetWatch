import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { getCurrentUser, setSessionCookie } from "@/lib/auth/session";
import { signJWT } from "@/lib/auth/jwt";
import { checkRateLimit, getClientIp, verifySameOrigin } from "@/lib/auth/security";
import { changePasswordSchema } from "@/lib/validations/auth";
import {
  changeUserPasswordRecord,
  getUserRecordById,
  verifyStoredUserPassword,
} from "@/lib/auth/account-store";

export async function POST(req: NextRequest) {
  try {
    if (!verifySameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Invalid request origin." } },
        { status: 403 }
      );
    }

    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in to change your password." } },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`change-pw:${session.userId}:${ip}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many password change attempts. Please wait a few minutes and try again.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.errors[0]?.message || "Password requirements were not met.",
          },
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;
    const userRecord = await getUserRecordById(session.userId);
    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Session is no longer valid." } },
        { status: 401 }
      );
    }

    const currentValid = await verifyStoredUserPassword(userRecord, currentPassword);
    if (!currentValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CURRENT_PASSWORD",
            message: "Your current password is incorrect.",
          },
        },
        { status: 400 }
      );
    }

    const matchesExistingHash = await bcrypt.compare(newPassword, userRecord.passwordHash);
    if (matchesExistingHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PASSWORD_REUSE",
            message: "New password must be different from your current password.",
          },
        },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await changeUserPasswordRecord(session.userId, newHash);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "SERVER_ERROR", message: "Unable to update password." } },
        { status: 500 }
      );
    }

    // Re-issue cookie with bumped sessionVersion so the current session stays valid while other sessions expire
    const newJwt = await signJWT({
      userId: updated.user.id,
      email: updated.user.email,
      name: updated.user.name,
      role: updated.user.role,
      departmentId: updated.user.departmentId,
      sessionVersion: updated.sessionVersion,
    });
    await setSessionCookie(newJwt);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Other active sessions have been signed out.",
      data: { user: updated.user },
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to change password right now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
