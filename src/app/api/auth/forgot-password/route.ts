import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import {
  checkRateLimit,
  generateSecureToken,
  getAppBaseUrl,
  getClientIp,
  hashTokenSha256,
  verifySameOrigin,
} from "@/lib/auth/security";
import { createPasswordResetTokenRecord } from "@/lib/auth/account-store";
import { buildPasswordResetEmail, sendTransactionalEmail } from "@/lib/email/mailer";

const RESET_EXPIRY_MINUTES = 30;
const NEUTRAL_RESPONSE_MESSAGE =
  "If an account exists for this email, password reset instructions have been sent.";

export async function POST(req: NextRequest) {
  try {
    if (!verifySameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Invalid request origin." } },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`forgot-ip:${ip}`, 8, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many password reset requests. Please wait a few minutes and try again.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please enter a valid email address.",
          },
        },
        { status: 400 }
      );
    }

    const normalizedEmail = result.data.email.toLowerCase();
    const emailHash = hashTokenSha256(normalizedEmail);
    const emailLimit = checkRateLimit(`forgot-email:${emailHash}`, 4, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many reset requests for this address. Please wait before requesting another link.",
          },
        },
        { status: 429 }
      );
    }

    const rawToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

    const recipient = await createPasswordResetTokenRecord(normalizedEmail, rawToken, expiresAt);

    if (recipient) {
      const baseUrl = getAppBaseUrl(req);
      const resetUrl = `${baseUrl}/reset-password/${rawToken}`;
      const mailContent = buildPasswordResetEmail({
        recipientName: recipient.userName,
        resetUrl,
        expiresMinutes: RESET_EXPIRY_MINUTES,
      });

      try {
        await sendTransactionalEmail({
          to: recipient.email,
          ...mailContent,
        });
      } catch (mailError) {
        console.error("Password reset email delivery error:", mailError);
        // Do not expose SMTP state or whether email existed in normal reset endpoint
      }
    }

    return NextResponse.json({
      success: true,
      message: NEUTRAL_RESPONSE_MESSAGE,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to process your request right now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
