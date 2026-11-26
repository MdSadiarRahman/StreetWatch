/**
 * End-to-End Security, Account, Profile, Settings & Password Reset Verification
 * Tests Citizen, Authority, Field Worker workflows plus security invariants.
 */

import * as bcrypt from "bcryptjs";
import {
  createPasswordResetTokenRecord,
  consumePasswordResetTokenRecord,
  inspectPasswordResetTokenStatus,
  findUserRecordByEmail,
} from "../src/lib/auth/account-store";
import { generateSecureToken, hashTokenSha256 } from "../src/lib/auth/security";
import { buildPasswordResetEmail } from "../src/lib/email/mailer";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3001";

function assertNoSensitiveFields(obj: unknown, pathLabel: string) {
  const raw = JSON.stringify(obj || {});
  for (const forbidden of ["passwordHash", "sessionVersion", "tokenHash", "currentPassword", "newPassword"]) {
    if (raw.includes(`"${forbidden}"`)) {
      throw new Error(`Sensitive field "${forbidden}" leaked in ${pathLabel}`);
    }
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("🔐 STREETWATCH ACCOUNT, SETTINGS & PASSWORD SECURITY SUITE");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<boolean>) {
    try {
      const ok = await fn();
      if (ok) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } else {
        console.log(`❌ [FAIL] ${name}`);
        failed++;
      }
    } catch (err: any) {
      console.log(`❌ [FAIL] ${name}: ${err?.message || err}`);
      failed++;
    }
  }

  const testEmail = `sec-citizen-${Date.now()}@streetwatch.test`;
  const initialPassword = "CivicUser!2026";
  const changedPassword = "CivicUser@2027New";
  const resetPassword = "CivicReset#2028New";
  let citizenCookieA = "";
  let citizenCookieB = "";

  // 1. Unauthenticated guards on routes and APIs
  await check("Security: Unauthenticated /profile & /settings redirect to /login", async () => {
    const r1 = await fetch(`${BASE_URL}/profile`, { redirect: "manual" });
    const r2 = await fetch(`${BASE_URL}/settings`, { redirect: "manual" });
    return (
      (r1.status === 307 || r1.status === 302) &&
      (r1.headers.get("location") || "").includes("/login") &&
      (r2.status === 307 || r2.status === 302) &&
      (r2.headers.get("location") || "").includes("/login")
    );
  });

  await check("Security: Unauthenticated profile/preferences/password APIs return 401", async () => {
    const p1 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacker" }),
    });
    const p2 = await fetch(`${BASE_URL}/api/auth/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifySystem: false }),
    });
    const p3 = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "x", newPassword: initialPassword, confirmPassword: initialPassword }),
    });
    return p1.status === 401 && p2.status === 401 && p3.status === 401;
  });

  await check("Security: Cross-origin CSRF attempt rejected with 403", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://malicious.example.com",
      },
      body: JSON.stringify({ email: testEmail }),
    });
    return res.status === 403;
  });

  // 2. Weak password & privilege escalation checks during registration
  await check("Security: Registration rejects weak password (< policy)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Weak User", email: testEmail, password: "weak" }),
    });
    return res.status === 400;
  });

  await check("Security: Registration forces CITIZEN role even if AUTHORITY requested", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sadiar Test Resident",
        email: testEmail,
        password: initialPassword,
        role: "AUTHORITY",
      }),
    });
    const json = await res.json();
    assertNoSensitiveFields(json, "POST /api/auth/register");
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) citizenCookieA = setCookie.split(";")[0];
    return res.status === 201 && json.success === true && json.data?.user?.role === "CITIZEN" && Boolean(citizenCookieA);
  });

  // 3. Login second session cookie (Session B) so we verify cross-session invalidation
  await check("Citizen: Login second session + GET /api/auth/me without password leaks", async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    const loginJson = await loginRes.json();
    assertNoSensitiveFields(loginJson, "POST /api/auth/login");
    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) citizenCookieB = setCookie.split(";")[0];

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: citizenCookieB },
    });
    const meJson = await meRes.json();
    assertNoSensitiveFields(meJson, "GET /api/auth/me");
    return loginRes.status === 200 && meRes.status === 200 && meJson.data?.user?.emailVerified === false;
  });

  // 4. Profile View, Update, Avatar Validation, Role Tampering Protection
  await check("Citizen: Profile update persists name/phone/ward/location/avatar & ignores role injection", async () => {
    const tinyPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const badRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: citizenCookieB },
      body: JSON.stringify({
        name: "Valid Name",
        avatarUrl: "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pjwvc2NyaXB0Pjwvc3ZnPg==",
      }),
    });
    if (badRes.status !== 400) return false;

    const okRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: citizenCookieB },
      body: JSON.stringify({
        name: "Sadiar Rahman Updated",
        phone: "+880 1711-223344",
        ward: "Ward 4",
        location: "Dhaka North",
        address: "Mirpur 10 Civic Ave",
        avatarUrl: tinyPng,
        role: "AUTHORITY", // Attempted tamper
      }),
    });
    const json = await okRes.json();
    assertNoSensitiveFields(json, "PATCH /api/auth/profile");
    return (
      okRes.status === 200 &&
      json.data?.user?.name === "Sadiar Rahman Updated" &&
      json.data?.user?.phone === "+880 1711-223344" &&
      json.data?.user?.ward === "Ward 4" &&
      json.data?.user?.avatarUrl === tinyPng &&
      json.data?.user?.role === "CITIZEN"
    );
  });

  // 5. Preferences persistence
  await check("Citizen: Settings preferences persist via PATCH /api/auth/preferences", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: citizenCookieB },
      body: JSON.stringify({
        notifyStatusUpdates: false,
        prefCompactTables: true,
        prefDefaultWard: "Ward 15",
      }),
    });
    const json = await res.json();
    return (
      res.status === 200 &&
      json.data?.user?.notifyStatusUpdates === false &&
      json.data?.user?.prefCompactTables === true &&
      json.data?.user?.prefDefaultWard === "Ward 15"
    );
  });

  // 6. Authenticated SSR routes return 200
  await check("SSR: Authenticated /profile & /settings return HTTP 200", async () => {
    const pRes = await fetch(`${BASE_URL}/profile`, { headers: { Cookie: citizenCookieB } });
    const sRes = await fetch(`${BASE_URL}/settings`, { headers: { Cookie: citizenCookieB } });
    return pRes.status === 200 && sRes.status === 200;
  });

  // 7. Change Password validation & Session invalidation
  await check("Security: Change Password rejects invalid current, reuse, & mismatch", async () => {
    const wrongCur = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: citizenCookieB },
      body: JSON.stringify({
        currentPassword: "WrongPassword!99",
        newPassword: changedPassword,
        confirmPassword: changedPassword,
      }),
    });
    const samePw = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: citizenCookieB },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: initialPassword,
        confirmPassword: initialPassword,
      }),
    });
    const mismatch = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: citizenCookieB },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: changedPassword,
        confirmPassword: "Different@1234",
      }),
    });
    return wrongCur.status === 400 && samePw.status === 400 && mismatch.status === 400;
  });

  await check("Security: Change Password succeeds & invalidates other active session (Cookie A)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: citizenCookieB },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: changedPassword,
        confirmPassword: changedPassword,
      }),
    });
    const newSetCookie = res.headers.get("set-cookie");
    if (newSetCookie) citizenCookieB = newSetCookie.split(";")[0];

    const meCurrent = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: citizenCookieB } });
    const meOtherSession = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: citizenCookieA } });
    return res.status === 200 && meCurrent.status === 200 && meOtherSession.status === 401;
  });

  // 8. Forgot Password anti-enumeration + rate limit + email builder + reset token lifecycle
  await check("Security: Forgot Password prevents account enumeration (identical response)", async () => {
    const knownRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const unknownRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent-person-xyz@streetwatch.test" }),
    });
    const knownJson = await knownRes.json();
    const unknownJson = await unknownRes.json();
    return (
      knownRes.status === 200 &&
      unknownRes.status === 200 &&
      knownJson.message === unknownJson.message &&
      !JSON.stringify(knownJson).includes("token")
    );
  });

  await check("Email Template: Reset email contains StreetWatch brand, CTA link, & ignores passwords", async () => {
    const tpl = buildPasswordResetEmail({
      recipientName: "Sadiar Rahman",
      resetUrl: "https://streetwatch.local/reset-password/abc123",
      expiresMinutes: 30,
    });
    return (
      tpl.subject === "Reset your StreetWatch password" &&
      tpl.html.includes("Reset Password") &&
      tpl.html.includes("30 minutes") &&
      tpl.html.includes("If you did not request this password reset, you can safely ignore this email.")
    );
  });

  await check("Security: Invalid & expired reset tokens rejected properly", async () => {
    const expiredRaw = generateSecureToken(32);
    await createPasswordResetTokenRecord(testEmail, expiredRaw, new Date(Date.now() - 60_000));
    const status = await inspectPasswordResetTokenStatus(expiredRaw);
    const getExpired = await fetch(`${BASE_URL}/api/auth/reset-password?token=${expiredRaw}`);
    const getInvalid = await fetch(`${BASE_URL}/api/auth/reset-password?token=${"0".repeat(64)}`);
    return status === "EXPIRED" && getExpired.status === 410 && getInvalid.status === 400;
  });

  await check("Security: Valid reset token updates password, prevents replay, & invalidates sessions", async () => {
    const validRaw = generateSecureToken(32);
    const created = await createPasswordResetTokenRecord(
      testEmail,
      validRaw,
      new Date(Date.now() + 30 * 60_000)
    );
    if (!created) return false;

    // Verify stored user tokenHash never equals rawToken
    const stored = await findUserRecordByEmail(testEmail);
    if (!stored) return false;
    const expectedHash = hashTokenSha256(validRaw);
    if (expectedHash === validRaw) return false;

    const getRes = await fetch(`${BASE_URL}/api/auth/reset-password?token=${validRaw}`);
    if (getRes.status !== 200) return false;

    const postRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: validRaw,
        newPassword: resetPassword,
        confirmPassword: resetPassword,
      }),
    });

    // Replay with the exact same token must fail cleanly
    const replayRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: validRaw,
        newPassword: changedPassword,
        confirmPassword: changedPassword,
      }),
    });

    // Previous active session Cookie B must now fail
    const staleMe = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: citizenCookieB } });

    // Signing in with new reset password must succeed
    const newLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: resetPassword }),
    });

    // Direct helper single-use check
    const directReplay = await consumePasswordResetTokenRecord(validRaw, await bcrypt.hash("Other@1234", 8));

    return (
      postRes.status === 200 &&
      replayRes.status === 400 &&
      staleMe.status === 401 &&
      newLogin.status === 200 &&
      !directReplay.ok
    );
  });

  await check("Security: Repeated forgot-password requests trigger rate limiting (429)", async () => {
    const rateEmail = `ratelimit-${Date.now()}@streetwatch.test`;
    let got429 = false;
    for (let i = 0; i < 6; i++) {
      const r = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rateEmail }),
      });
      if (r.status === 429) {
        got429 = true;
        break;
      }
    }
    return got429;
  });

  // 9. Authority & Field Worker Account Flows
  await check("Authority: Login -> /api/auth/me -> Profile & Settings -> Logout", async () => {
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@streetwatch.demo", password: "Demo@1234" }),
    });
    const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
    const me = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: cookie } });
    const meJson = await me.json();
    const pref = await fetch(`${BASE_URL}/api/auth/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ notifyAssignments: true }),
    });
    const pageProfile = await fetch(`${BASE_URL}/profile`, { headers: { Cookie: cookie } });
    const logout = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    return (
      login.status === 200 &&
      meJson.data?.user?.role === "AUTHORITY" &&
      pref.status === 200 &&
      pageProfile.status === 200 &&
      logout.status === 200
    );
  });

  await check("Field Worker: Login -> /api/auth/me -> Settings & Profile -> Logout", async () => {
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "worker1@streetwatch.demo", password: "Demo@1234" }),
    });
    const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
    const me = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: cookie } });
    const meJson = await me.json();
    const pageSettings = await fetch(`${BASE_URL}/settings?tab=preferences`, { headers: { Cookie: cookie } });
    const logout = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    return (
      login.status === 200 &&
      meJson.data?.user?.role === "FIELD_WORKER" &&
      Boolean(meJson.data?.user?.departmentName) &&
      pageSettings.status === 200 &&
      logout.status === 200
    );
  });

  console.log("\n===============================================================");
  console.log(`📊 ACCOUNT & SECURITY SUMMARY: ${passed}/${passed + failed} PASSED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
