import crypto from "crypto";
import type { NextRequest } from "next/server";

interface RateBucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __streetwatchRateBuckets?: Map<string, RateBucket>;
};

function getRateBuckets(): Map<string, RateBucket> {
  if (!globalForRateLimit.__streetwatchRateBuckets) {
    globalForRateLimit.__streetwatchRateBuckets = new Map<string, RateBucket>();
  }
  return globalForRateLimit.__streetwatchRateBuckets;
}

/**
 * Generate a cryptographically random hex token (default 32 bytes -> 64 hex chars).
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/**
 * Hash a secret token deterministically with SHA-256 before database persistence.
 */
export function hashTokenSha256(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Extract best-effort client IP address from request headers.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim() || "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

/**
 * Sliding/fixed window rate limiter stored in globalThis to prevent abuse across endpoints.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const buckets = getRateBuckets();
  const now = Date.now();

  // Periodic opportunistic cleanup of expired buckets
  if (buckets.size > 500) {
    buckets.forEach((b, k) => {
      if (b.resetAt <= now) buckets.delete(k);
    });
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * Verify Origin/Referer header when present on state-changing requests (CSRF defense-in-depth).
 * Allows non-browser CLI/API requests without an Origin header while blocking cross-site browser requests.
 */
export function verifySameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const host = req.headers.get("host");
  if (!host) return false;

  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.host === host) {
      return true;
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const parsedAppUrl = new URL(appUrl);
      if (parsedOrigin.host === parsedAppUrl.host) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Determine base public URL safely for email action links.
 */
export function getAppBaseUrl(req?: NextRequest): string {
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  if (req) {
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}
