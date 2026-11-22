import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { signJWT } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid login credentials",
            details: result.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

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

    const isValid = await bcrypt.compare(password, user.passwordHash);
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

    // Create Audit Log
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_LOGIN",
        entityType: "User",
        entityId: user.id,
        metadata: { role: user.role, email: user.email },
      },
    });

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          trustScore: user.trustScore,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error during login.",
        },
      },
      { status: 500 }
    );
  }
}
