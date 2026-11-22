import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/types";

const JWT_SECRET =
  process.env.JWT_SECRET || "streetwatch-super-secure-jwt-secret-key-hack-the-vibe-2026";
const key = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  departmentId?: string | null;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
