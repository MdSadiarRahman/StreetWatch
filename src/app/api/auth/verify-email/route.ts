import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  checkRateLimit,
  generateSecureToken,
  getAppBaseUrl,
  getClientIp,
  verifySameOrigin,
} from "@/lib/auth/security";
import {
  consumeEmailVerificationTokenRecord,
  createEmailVerificationTokenRecord,
  getUserRecordById,
} from "@/lib/auth/account-store";
import { verifyEmailTokenSchema } from "@/lib/validations/auth";
import { buildEmailVerificationEmail, sendTransactionalEmail } from "@/lib/email/mailer";

const VERIFY_EXPIRY_HOURS = 24;

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
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`verify-email:${session.userId}:${ip}`, 4, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many verification email requests. Please wait a few minutes.",
          },
        },
        { status: 429 }
      );
    }

    const userRecord = await getUserRecordById(session.userId);
    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Account not found." } },
        { status: 404 }
      );
    }

    if (userRecord.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Your email address is already verified.",
      });
    }

    const rawToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);
    const target = await createEmailVerificationTokenRecord(session.userId, rawToken, expiresAt);

    if (target) {
      const verifyUrl = `${getAppBaseUrl(req)}/verify-email/${rawToken}`;
      const mail = buildEmailVerificationEmail({
        recipientName: target.userName,
        verifyUrl,
        expiresHours: VERIFY_EXPIRY_HOURS,
      });

      await sendTransactionalEmail({
        to: target.email,
        ...mail,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Verification link has been sent to your registered email address.",
    });
  } catch (error) {
    console.error("Verify Email Request Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to send verification email right now.",
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!verifySameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Invalid request origin." } },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`verify-email-confirm:${ip}`, 15, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "Too many confirmation attempts. Please wait." },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = verifyEmailTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "TOKEN_INVALID", message: "Invalid or unavailable verification link." },
        },
        { status: 400 }
      );
    }

    const result = await consumeEmailVerificationTokenRecord(parsed.data.token);
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.reason === "EXPIRED" ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
            message:
              result.reason === "EXPIRED"
                ? "Your email verification link has expired."
                : "Invalid or unavailable verification link.",
          },
        },
        { status: result.reason === "EXPIRED" ? 410 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your email address has been verified.",
      data: { user: result.user },
    });
  } catch (error) {
    console.error("Verify Email Confirm Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Unable to verify email right now." },
      },
      { status: 500 }
    );
  }
}
