import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { signJWT } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, getClientIp, verifySameOrigin } from "@/lib/auth/security";
import {
  findUserRecordByEmail,
  recordAuthAuditLog,
  sanitizeUser,
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

    const ip = getClientIp(req);
    const rate = checkRateLimit(`login:${ip}`, 30, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many sign-in attempts. Please wait a few minutes and try again.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please enter a valid email and password.",
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const user = await findUserRecordByEmail(email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
        { status: 401 }
      );
    }

    const isValid = await verifyStoredUserPassword(user, password);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
        { status: 401 }
      );
    }

    await recordAuthAuditLog(user.id, "USER_LOGIN", user.id, {
      role: user.role,
    });

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      sessionVersion: user.sessionVersion,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to sign in right now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
