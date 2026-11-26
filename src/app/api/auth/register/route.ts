import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth";
import { signJWT } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, getClientIp, verifySameOrigin } from "@/lib/auth/security";
import { registerCitizenUser } from "@/lib/auth/account-store";

export async function POST(req: NextRequest) {
  try {
    if (!verifySameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Invalid request origin." } },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`register:${ip}`, 15, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many registration attempts. Please try again shortly.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.errors[0]?.message || "Invalid registration details.",
            details: result.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const passwordHash = await bcrypt.hash(password, 10);

    // Server-side authorization invariant: public registration always creates CITIZEN accounts
    const registration = await registerCitizenUser({
      name,
      email,
      passwordHash,
    });

    if (!registration.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "An account with this email address already exists.",
          },
        },
        { status: 409 }
      );
    }

    const token = await signJWT({
      userId: registration.user.id,
      email: registration.user.email,
      name: registration.user.name,
      role: registration.user.role,
      departmentId: registration.user.departmentId,
      sessionVersion: registration.sessionVersion,
    });

    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: registration.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to create your account right now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
