import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { signJWT } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid registration input",
            details: result.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { name, email, password, role, departmentId } = result.data;

    // Check existing email
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
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

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        departmentId: departmentId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        trustScore: true,
        createdAt: true,
      },
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        actorId: newUser.id,
        action: "USER_REGISTER",
        entityType: "User",
        entityId: newUser.id,
        metadata: { role: newUser.role, email: newUser.email },
      },
    });

    const token = await signJWT({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      departmentId: newUser.departmentId,
    });

    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: newUser,
          token,
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
          message: "Internal server error during registration.",
        },
      },
      { status: 500 }
    );
  }
}
