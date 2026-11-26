import { cookies } from "next/headers";
import { verifyJWT, JWTPayload } from "./jwt";
import { getUserSessionVersion } from "./account-store";
import { Role } from "@/types";

export const SESSION_COOKIE_NAME = "streetwatch_session";

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload) return null;

  // Enforce server-side sessionVersion check so password change/reset invalidates older tokens
  const expectedVersion = await getUserSessionVersion(payload.userId);
  if (expectedVersion === null) return null;
  if ((payload.sessionVersion ?? 1) !== expectedVersion) {
    return null;
  }

  return payload;
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<JWTPayload> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
