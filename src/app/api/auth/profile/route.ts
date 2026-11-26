import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, setSessionCookie } from "@/lib/auth/session";
import { signJWT } from "@/lib/auth/jwt";
import { verifySameOrigin } from "@/lib/auth/security";
import { updateProfileSchema } from "@/lib/validations/auth";
import { getUserRecordById, updateUserProfileRecord } from "@/lib/auth/account-store";

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
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.errors[0]?.message || "Please check your profile details.",
            details: result.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfileRecord(session.userId, result.data);
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Account record not found." } },
        { status: 404 }
      );
    }

    // Refresh JWT cookie if display name changed so SSR headers stay in sync
    const latestRecord = await getUserRecordById(session.userId);
    const refreshedToken = await signJWT({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      departmentId: updatedUser.departmentId,
      sessionVersion: latestRecord?.sessionVersion ?? session.sessionVersion ?? 1,
    });
    await setSessionCookie(refreshedToken);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to update your profile. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
