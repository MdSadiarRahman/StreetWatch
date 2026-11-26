import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/auth/security";
import { updatePreferencesSchema } from "@/lib/validations/auth";
import { updateUserPreferencesRecord } from "@/lib/auth/account-store";

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const result = updatePreferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid preference settings.",
          },
        },
        { status: 400 }
      );
    }

    // Role-based restriction on assignment notification preferences
    const payload = { ...result.data };
    if (session.role === "CITIZEN") {
      delete payload.notifyAssignments;
    }

    const updatedUser = await updateUserPreferencesRecord(session.userId, payload);
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Account not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Preferences saved successfully.",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Preferences Update Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to save preferences right now. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
