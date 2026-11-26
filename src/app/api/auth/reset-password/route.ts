import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp, verifySameOrigin } from "@/lib/auth/security";
import { clearSessionCookie } from "@/lib/auth/session";
import {
  consumePasswordResetTokenRecord,
  inspectPasswordResetTokenStatus,
} from "@/lib/auth/account-store";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`reset-inspect:${ip}`, 20, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many verification attempts. Please try again later.",
        },
      },
      { status: 429 }
    );
  }

  const token = req.nextUrl.searchParams.get("token") || "";
  const status = await inspectPasswordResetTokenStatus(token);

  if (status === "EXPIRED") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Your password reset link has expired.",
        },
      },
      { status: 410 }
    );
  }

  if (status !== "VALID") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or unavailable reset link.",
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { valid: true },
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!verifySameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Invalid request origin." } },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`reset-submit:${ip}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many reset attempts. Please wait a few minutes and try again.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.errors[0]?.message || "Please enter a valid new password.",
          },
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = result.data;
    const newHash = await bcrypt.hash(newPassword, 10);

    const consumed = await consumePasswordResetTokenRecord(token, newHash);
    if (!consumed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: consumed.reason === "EXPIRED" ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
            message:
              consumed.reason === "EXPIRED"
                ? "Your password reset link has expired."
                : "Invalid or unavailable reset link.",
          },
        },
        { status: consumed.reason === "EXPIRED" ? 410 : 400 }
      );
    }

    // Clear active cookie in browser if user had one so they sign in cleanly with new password
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to reset password right now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
