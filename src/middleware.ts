import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "streetwatch-super-secure-jwt-secret-key-hack-the-vibe-2026";
const key = new TextEncoder().encode(JWT_SECRET);

interface DecodedToken {
  userId: string;
  email: string;
  role: "CITIZEN" | "AUTHORITY" | "FIELD_WORKER";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("streetwatch_session")?.value;

  let user: DecodedToken | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      user = payload as unknown as DecodedToken;
    } catch {
      user = null;
    }
  }

  // 1. If logged in and visiting login or register, redirect to appropriate dashboard
  if (user && (pathname === "/login" || pathname === "/register")) {
    if (user.role === "AUTHORITY") {
      return NextResponse.redirect(new URL("/authority", request.url));
    }
    if (user.role === "FIELD_WORKER") {
      return NextResponse.redirect(new URL("/worker", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Protected routes validation
  const isCitizenRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/report");
  const isAuthorityRoute = pathname.startsWith("/authority");
  const isWorkerRoute = pathname.startsWith("/worker");

  if (isCitizenRoute || isAuthorityRoute || isWorkerRoute) {
    // Unauthenticated -> redirect to login
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based authorization (M03)
    if (isAuthorityRoute && user.role !== "AUTHORITY") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isWorkerRoute && user.role !== "FIELD_WORKER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isCitizenRoute && user.role !== "CITIZEN" && user.role !== "AUTHORITY") {
      return NextResponse.redirect(new URL("/worker", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/report/:path*",
    "/authority/:path*",
    "/worker/:path*",
    "/login",
    "/register",
  ],
};
