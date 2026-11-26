import fs from "fs";
import os from "os";
import path from "path";
import * as bcrypt from "bcryptjs";
import { Role } from "@/types";
import { db } from "@/lib/db";
import { MOCK_DEPARTMENTS, MOCK_USERS } from "@/lib/mock-data";
import { hashTokenSha256 } from "@/lib/auth/security";
import type { UpdatePreferencesInput, UpdateProfileInput } from "@/lib/validations/auth";
import type { UserProfile } from "@/types";

export interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone: string | null;
  ward: string | null;
  location: string | null;
  address: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  passwordChangedAt: string | null;
  sessionVersion: number;
  notifyStatusUpdates: boolean;
  notifyAssignments: boolean;
  notifyResolutions: boolean;
  notifySystem: boolean;
  prefCompactTables: boolean;
  prefDefaultWard: string | null;
  departmentId: string | null;
  departmentName?: string | null;
  workerCapacity: number;
  activeTaskCount: number;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

interface StoredTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

interface FallbackAccountDatabase {
  users: StoredUserRecord[];
  resetTokens: StoredTokenRecord[];
  verificationTokens: StoredTokenRecord[];
}

const FALLBACK_STORE_PATH = path.join(os.tmpdir(), "streetwatch-account-fallback-v1.json");
const DEMO_SEED_HASH = bcrypt.hashSync("Demo@1234", 8);

const DEMO_META_BY_EMAIL: Record<
  string,
  { phone: string; ward: string; location: string; address: string }
> = {
  "citizen@streetwatch.demo": {
    phone: "+8801711000001",
    ward: "Ward 4",
    location: "Dhaka North",
    address: "Mirpur Sector 10, Road 12",
  },
  "citizen1@streetwatch.demo": {
    phone: "+8801711000001",
    ward: "Ward 4",
    location: "Dhaka North",
    address: "Mirpur Sector 10, Road 12",
  },
  "admin@streetwatch.demo": {
    phone: "+8801711000099",
    ward: "DNCC HQ",
    location: "Dhaka Metropolitan",
    address: "Nagar Bhaban Command Desk",
  },
  "authority@streetwatch.demo": {
    phone: "+8801711000099",
    ward: "DNCC HQ",
    location: "Dhaka Metropolitan",
    address: "Nagar Bhaban Command Desk",
  },
  "worker1@streetwatch.demo": {
    phone: "+8801711000101",
    ward: "Ward 4",
    location: "Dhaka North",
    address: "Mirpur Operations Depot",
  },
  "worker2@streetwatch.demo": {
    phone: "+8801711000102",
    ward: "Ward 9",
    location: "Dhaka North",
    address: "Gulshan-Badda Maintenance Unit",
  },
};

export function isSeededDemoEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return Object.prototype.hasOwnProperty.call(DEMO_META_BY_EMAIL, lower);
}

function buildInitialFallbackState(): FallbackAccountDatabase {
  const now = new Date().toISOString();
  const users: StoredUserRecord[] = MOCK_USERS.map((u) => {
    const meta = DEMO_META_BY_EMAIL[u.email.toLowerCase()] || {
      phone: "+8801700000000",
      ward: "Ward 4",
      location: "Dhaka",
      address: "Dhaka Metropolitan Area",
    };
    const dept = u.departmentId
      ? MOCK_DEPARTMENTS.find((d) => d.id === u.departmentId)?.name || null
      : null;

    return {
      id: u.id,
      name: u.name,
      email: u.email.toLowerCase(),
      passwordHash: DEMO_SEED_HASH,
      role: u.role as Role,
      phone: meta.phone,
      ward: meta.ward,
      location: meta.location,
      address: meta.address,
      avatarUrl: null,
      emailVerified: true,
      emailVerifiedAt: now,
      passwordChangedAt: null,
      sessionVersion: 1,
      notifyStatusUpdates: true,
      notifyAssignments: true,
      notifyResolutions: true,
      notifySystem: true,
      prefCompactTables: false,
      prefDefaultWard: meta.ward,
      departmentId: u.departmentId,
      departmentName: dept,
      workerCapacity: u.workerCapacity,
      activeTaskCount: u.activeTaskCount,
      trustScore: u.trustScore,
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    users,
    resetTokens: [],
    verificationTokens: [],
  };
}

function readFallbackStore(): FallbackAccountDatabase {
  try {
    if (fs.existsSync(FALLBACK_STORE_PATH)) {
      const raw = fs.readFileSync(FALLBACK_STORE_PATH, "utf8");
      const parsed = JSON.parse(raw) as FallbackAccountDatabase;
      if (parsed && Array.isArray(parsed.users)) {
        return {
          users: parsed.users,
          resetTokens: Array.isArray(parsed.resetTokens) ? parsed.resetTokens : [],
          verificationTokens: Array.isArray(parsed.verificationTokens)
            ? parsed.verificationTokens
            : [],
        };
      }
    }
  } catch {
    // Recreate clean state if corrupted
  }
  const initial = buildInitialFallbackState();
  writeFallbackStore(initial);
  return initial;
}

function writeFallbackStore(store: FallbackAccountDatabase): void {
  try {
    fs.writeFileSync(FALLBACK_STORE_PATH, JSON.stringify(store), "utf8");
  } catch {
    // Ignore fs failures in read-only edge cases
  }
}

function resolveDepartmentName(departmentId: string | null | undefined, explicitName?: string | null): string | null {
  if (explicitName) return explicitName;
  if (!departmentId) return null;
  return MOCK_DEPARTMENTS.find((d) => d.id === departmentId)?.name || null;
}

const DB_OFFLINE_COOLDOWN_MS = 20_000;
const globalForDbCircuit = globalThis as unknown as {
  __streetwatchAccountDbOfflineUntil?: number;
};

function isDbConnectionError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "P1001" || code === "P1002" || code === "P1008" || code === "P1017") {
    return true;
  }
  const msg = String((err as { message?: string })?.message || err || "");
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("Connection terminated")
  );
}

async function withAccountDb<T>(
  dbOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T> | T
): Promise<T> {
  const offlineUntil = globalForDbCircuit.__streetwatchAccountDbOfflineUntil ?? 0;
  if (offlineUntil > Date.now()) {
    return fallbackOperation();
  }
  try {
    return await dbOperation();
  } catch (err) {
    if (isDbConnectionError(err)) {
      globalForDbCircuit.__streetwatchAccountDbOfflineUntil = Date.now() + DB_OFFLINE_COOLDOWN_MS;
      return fallbackOperation();
    }
    throw err;
  }
}

export function sanitizeUser(record: {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  phone?: string | null;
  ward?: string | null;
  location?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: Date | string | null;
  passwordChangedAt?: Date | string | null;
  notifyStatusUpdates?: boolean;
  notifyAssignments?: boolean;
  notifyResolutions?: boolean;
  notifySystem?: boolean;
  prefCompactTables?: boolean;
  prefDefaultWard?: string | null;
  departmentId?: string | null;
  department?: { name: string } | null;
  departmentName?: string | null;
  workerCapacity?: number;
  activeTaskCount?: number;
  trustScore?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}): UserProfile {
  const toIso = (val: Date | string | null | undefined): string | null => {
    if (!val) return null;
    return val instanceof Date ? val.toISOString() : String(val);
  };

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role as Role,
    phone: record.phone ?? null,
    ward: record.ward ?? null,
    location: record.location ?? null,
    address: record.address ?? null,
    avatarUrl: record.avatarUrl ?? null,
    emailVerified: Boolean(record.emailVerified),
    emailVerifiedAt: toIso(record.emailVerifiedAt),
    passwordChangedAt: toIso(record.passwordChangedAt),
    notifyStatusUpdates: record.notifyStatusUpdates ?? true,
    notifyAssignments: record.notifyAssignments ?? true,
    notifyResolutions: record.notifyResolutions ?? true,
    notifySystem: record.notifySystem ?? true,
    prefCompactTables: record.prefCompactTables ?? false,
    prefDefaultWard: record.prefDefaultWard ?? null,
    departmentId: record.departmentId ?? null,
    departmentName: resolveDepartmentName(
      record.departmentId,
      record.department?.name ?? record.departmentName
    ),
    workerCapacity: record.workerCapacity ?? 0,
    activeTaskCount: record.activeTaskCount ?? 0,
    trustScore: record.trustScore ?? 1.0,
    createdAt: toIso(record.createdAt) || undefined,
    updatedAt: toIso(record.updatedAt) || undefined,
  };
}

function mapDbUserToStoredRecord(dbUser: any): StoredUserRecord {
  const iso = (v: Date | string | null | undefined) =>
    v instanceof Date ? v.toISOString() : v ? String(v) : null;

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    passwordHash: dbUser.passwordHash,
    role: dbUser.role as Role,
    phone: dbUser.phone ?? null,
    ward: dbUser.ward ?? null,
    location: dbUser.location ?? null,
    address: dbUser.address ?? null,
    avatarUrl: dbUser.avatarUrl ?? null,
    emailVerified: Boolean(dbUser.emailVerified),
    emailVerifiedAt: iso(dbUser.emailVerifiedAt),
    passwordChangedAt: iso(dbUser.passwordChangedAt),
    sessionVersion: dbUser.sessionVersion ?? 1,
    notifyStatusUpdates: dbUser.notifyStatusUpdates ?? true,
    notifyAssignments: dbUser.notifyAssignments ?? true,
    notifyResolutions: dbUser.notifyResolutions ?? true,
    notifySystem: dbUser.notifySystem ?? true,
    prefCompactTables: dbUser.prefCompactTables ?? false,
    prefDefaultWard: dbUser.prefDefaultWard ?? null,
    departmentId: dbUser.departmentId ?? null,
    departmentName: resolveDepartmentName(dbUser.departmentId, dbUser.department?.name),
    workerCapacity: dbUser.workerCapacity ?? 0,
    activeTaskCount: dbUser.activeTaskCount ?? 0,
    trustScore: dbUser.trustScore ?? 1.0,
    createdAt: iso(dbUser.createdAt) || new Date().toISOString(),
    updatedAt: iso(dbUser.updatedAt) || new Date().toISOString(),
  };
}

export async function getUserSessionVersion(userId: string): Promise<number | null> {
  return withAccountDb(
    async () => {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { sessionVersion: true },
      });
      return row ? row.sessionVersion : null;
    },
    () => {
      const store = readFallbackStore();
      const user = store.users.find((u) => u.id === userId);
      return user ? user.sessionVersion : 1;
    }
  );
}

export async function getUserRecordById(userId: string): Promise<StoredUserRecord | null> {
  return withAccountDb(
    async () => {
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        include: { department: { select: { name: true } } },
      });
      return dbUser ? mapDbUserToStoredRecord(dbUser) : null;
    },
    () => {
      const store = readFallbackStore();
      return store.users.find((u) => u.id === userId) || null;
    }
  );
}

export async function findUserRecordByEmail(email: string): Promise<StoredUserRecord | null> {
  const lower = email.toLowerCase().trim();
  return withAccountDb(
    async () => {
      const dbUser = await db.user.findUnique({
        where: { email: lower },
        include: { department: { select: { name: true } } },
      });
      return dbUser ? mapDbUserToStoredRecord(dbUser) : null;
    },
    () => {
      const store = readFallbackStore();
      return store.users.find((u) => u.email.toLowerCase() === lower) || null;
    }
  );
}

export async function verifyStoredUserPassword(
  user: StoredUserRecord,
  candidatePassword: string
): Promise<boolean> {
  if (!user.passwordHash) return false;
  const matchesHash = await bcrypt.compare(candidatePassword, user.passwordHash);
  if (matchesHash) return true;

  // Demo credentials only remain valid while demo account password has not been customized
  if (isSeededDemoEmail(user.email) && !user.passwordChangedAt) {
    return candidatePassword === "Demo@1234" || candidatePassword === "P@ssw0rd2026!";
  }
  return false;
}

export async function registerCitizenUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<
  | { ok: true; user: UserProfile; sessionVersion: number }
  | { ok: false; code: "EMAIL_EXISTS" }
> {
  const normalizedEmail = input.email.toLowerCase().trim();

  return withAccountDb(
    async () => {
      const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return { ok: false, code: "EMAIL_EXISTS" };
      }

      const created = await db.user.create({
        data: {
          name: input.name,
          email: normalizedEmail,
          passwordHash: input.passwordHash,
          role: "CITIZEN",
          emailVerified: false,
          sessionVersion: 1,
        },
        include: { department: { select: { name: true } } },
      });

      await db.auditLog.create({
        data: {
          actorId: created.id,
          action: "USER_REGISTER",
          entityType: "User",
          entityId: created.id,
          metadata: { role: created.role, email: created.email },
        },
      });

      return {
        ok: true,
        user: sanitizeUser(created),
        sessionVersion: created.sessionVersion,
      };
    },
    () => {
      const store = readFallbackStore();
      if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, code: "EMAIL_EXISTS" };
      }

      const now = new Date().toISOString();
      const newUser: StoredUserRecord = {
        id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: input.name,
        email: normalizedEmail,
        passwordHash: input.passwordHash,
        role: "CITIZEN",
        phone: null,
        ward: null,
        location: null,
        address: null,
        avatarUrl: null,
        emailVerified: false,
        emailVerifiedAt: null,
        passwordChangedAt: null,
        sessionVersion: 1,
        notifyStatusUpdates: true,
        notifyAssignments: true,
        notifyResolutions: true,
        notifySystem: true,
        prefCompactTables: false,
        prefDefaultWard: null,
        departmentId: null,
        departmentName: null,
        workerCapacity: 0,
        activeTaskCount: 0,
        trustScore: 1.0,
        createdAt: now,
        updatedAt: now,
      };

      store.users.push(newUser);
      writeFallbackStore(store);

      return {
        ok: true,
        user: sanitizeUser(newUser),
        sessionVersion: newUser.sessionVersion,
      };
    }
  );
}

export async function updateUserProfileRecord(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile | null> {
  const cleanData = {
    name: input.name,
    phone: input.phone ?? null,
    ward: input.ward ?? null,
    location: input.location ?? null,
    address: input.address ?? null,
    ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
  };

  return withAccountDb(
    async () => {
      const updated = await db.user.update({
        where: { id: userId },
        data: cleanData,
        include: { department: { select: { name: true } } },
      });

      await db.auditLog
        .create({
          data: {
            actorId: userId,
            action: "PROFILE_UPDATED",
            entityType: "User",
            entityId: userId,
            metadata: { fieldsUpdated: Object.keys(cleanData) },
          },
        })
        .catch(() => {});

      return sanitizeUser(updated);
    },
    () => {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.id === userId);
      if (idx === -1) return null;

      store.users[idx] = {
        ...store.users[idx],
        ...cleanData,
        updatedAt: new Date().toISOString(),
      };
      writeFallbackStore(store);
      return sanitizeUser(store.users[idx]);
    }
  );
}

export async function updateUserPreferencesRecord(
  userId: string,
  input: UpdatePreferencesInput
): Promise<UserProfile | null> {
  const cleanData = {
    ...(input.notifyStatusUpdates !== undefined ? { notifyStatusUpdates: input.notifyStatusUpdates } : {}),
    ...(input.notifyAssignments !== undefined ? { notifyAssignments: input.notifyAssignments } : {}),
    ...(input.notifyResolutions !== undefined ? { notifyResolutions: input.notifyResolutions } : {}),
    ...(input.notifySystem !== undefined ? { notifySystem: input.notifySystem } : {}),
    ...(input.prefCompactTables !== undefined ? { prefCompactTables: input.prefCompactTables } : {}),
    ...(input.prefDefaultWard !== undefined ? { prefDefaultWard: input.prefDefaultWard || null } : {}),
  };

  return withAccountDb(
    async () => {
      const updated = await db.user.update({
        where: { id: userId },
        data: cleanData,
        include: { department: { select: { name: true } } },
      });

      await db.auditLog
        .create({
          data: {
            actorId: userId,
            action: "PREFERENCES_UPDATED",
            entityType: "User",
            entityId: userId,
            metadata: { fieldsUpdated: Object.keys(cleanData) },
          },
        })
        .catch(() => {});

      return sanitizeUser(updated);
    },
    () => {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.id === userId);
      if (idx === -1) return null;

      store.users[idx] = {
        ...store.users[idx],
        ...cleanData,
        updatedAt: new Date().toISOString(),
      };
      writeFallbackStore(store);
      return sanitizeUser(store.users[idx]);
    }
  );
}

export async function changeUserPasswordRecord(
  userId: string,
  newPasswordHash: string
): Promise<{ user: UserProfile; sessionVersion: number } | null> {
  const now = new Date();
  return withAccountDb(
    async () => {
      const updated = await db.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: now,
          sessionVersion: { increment: 1 },
        },
        include: { department: { select: { name: true } } },
      });

      await db.auditLog
        .create({
          data: {
            actorId: userId,
            action: "PASSWORD_CHANGED",
            entityType: "User",
            entityId: userId,
            metadata: { invalidatedOtherSessions: true },
          },
        })
        .catch(() => {});

      return {
        user: sanitizeUser(updated),
        sessionVersion: updated.sessionVersion,
      };
    },
    () => {
      const store = readFallbackStore();
      const idx = store.users.findIndex((u) => u.id === userId);
      if (idx === -1) return null;

      const nextVersion = (store.users[idx].sessionVersion || 1) + 1;
      store.users[idx] = {
        ...store.users[idx],
        passwordHash: newPasswordHash,
        passwordChangedAt: now.toISOString(),
        sessionVersion: nextVersion,
        updatedAt: now.toISOString(),
      };
      writeFallbackStore(store);

      return {
        user: sanitizeUser(store.users[idx]),
        sessionVersion: nextVersion,
      };
    }
  );
}

export async function createPasswordResetTokenRecord(
  email: string,
  rawToken: string,
  expiresAt: Date
): Promise<{ userId: string; userName: string; email: string } | null> {
  const lower = email.toLowerCase().trim();
  const tokenHash = hashTokenSha256(rawToken);
  const now = new Date();

  return withAccountDb(
    async () => {
      const user = await db.user.findUnique({ where: { email: lower } });
      if (!user) return null;

      await db.$transaction([
        db.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: now },
        }),
        db.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        }),
        db.auditLog.create({
          data: {
            actorId: user.id,
            action: "PASSWORD_RESET_REQUESTED",
            entityType: "User",
            entityId: user.id,
          },
        }),
      ]);

      return { userId: user.id, userName: user.name, email: user.email };
    },
    () => {
      const store = readFallbackStore();
      const user = store.users.find((u) => u.email.toLowerCase() === lower);
      if (!user) return null;

      const nowIso = now.toISOString();
      store.resetTokens = store.resetTokens.map((t) =>
        t.userId === user.id && !t.usedAt ? { ...t, usedAt: nowIso } : t
      );
      store.resetTokens.push({
        id: `prt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        tokenHash,
        expiresAt: expiresAt.toISOString(),
        usedAt: null,
        createdAt: nowIso,
      });
      writeFallbackStore(store);

      return { userId: user.id, userName: user.name, email: user.email };
    }
  );
}

export async function inspectPasswordResetTokenStatus(
  rawToken: string
): Promise<"VALID" | "EXPIRED" | "INVALID"> {
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
    return "INVALID";
  }

  const tokenHash = hashTokenSha256(rawToken);
  const now = new Date();

  return withAccountDb(
    async () => {
      const token = await db.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { usedAt: true, expiresAt: true },
      });
      if (!token || token.usedAt !== null) return "INVALID";
      if (token.expiresAt <= now) return "EXPIRED";
      return "VALID";
    },
    () => {
      const store = readFallbackStore();
      const token = store.resetTokens.find((t) => t.tokenHash === tokenHash);
      if (!token || token.usedAt !== null) return "INVALID";
      if (new Date(token.expiresAt) <= now) return "EXPIRED";
      return "VALID";
    }
  );
}

export async function consumePasswordResetTokenRecord(
  rawToken: string,
  newPasswordHash: string
): Promise<{ ok: true; userId: string } | { ok: false; reason: "EXPIRED" | "INVALID" }> {
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
    return { ok: false, reason: "INVALID" };
  }

  const tokenHash = hashTokenSha256(rawToken);
  const now = new Date();

  return withAccountDb(
    async () => {
      const token = await db.passwordResetToken.findUnique({
        where: { tokenHash },
      });

      if (!token || token.usedAt !== null) {
        return { ok: false, reason: "INVALID" };
      }
      if (token.expiresAt <= now) {
        return { ok: false, reason: "EXPIRED" };
      }

      const result = await db.$transaction(async (tx) => {
        const claimed = await tx.passwordResetToken.updateMany({
          where: {
            id: token.id,
            usedAt: null,
            expiresAt: { gt: now },
          },
          data: { usedAt: now },
        });

        if (claimed.count !== 1) {
          return { ok: false as const, reason: "INVALID" as const };
        }

        await tx.passwordResetToken.updateMany({
          where: { userId: token.userId, usedAt: null },
          data: { usedAt: now },
        });

        await tx.user.update({
          where: { id: token.userId },
          data: {
            passwordHash: newPasswordHash,
            passwordChangedAt: now,
            sessionVersion: { increment: 1 },
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: token.userId,
            action: "PASSWORD_RESET_COMPLETED",
            entityType: "User",
            entityId: token.userId,
          },
        });

        return { ok: true as const, userId: token.userId };
      });

      return result;
    },
    () => {
      const store = readFallbackStore();
      const tokenIdx = store.resetTokens.findIndex((t) => t.tokenHash === tokenHash);
      if (tokenIdx === -1) return { ok: false, reason: "INVALID" };

      const token = store.resetTokens[tokenIdx];
      if (token.usedAt !== null) return { ok: false, reason: "INVALID" };
      if (new Date(token.expiresAt) <= now) return { ok: false, reason: "EXPIRED" };

      const nowIso = now.toISOString();
      store.resetTokens = store.resetTokens.map((t) =>
        t.userId === token.userId && !t.usedAt ? { ...t, usedAt: nowIso } : t
      );

      const userIdx = store.users.findIndex((u) => u.id === token.userId);
      if (userIdx === -1) return { ok: false, reason: "INVALID" };

      store.users[userIdx] = {
        ...store.users[userIdx],
        passwordHash: newPasswordHash,
        passwordChangedAt: nowIso,
        sessionVersion: (store.users[userIdx].sessionVersion || 1) + 1,
        updatedAt: nowIso,
      };

      writeFallbackStore(store);
      return { ok: true, userId: token.userId };
    }
  );
}

export async function createEmailVerificationTokenRecord(
  userId: string,
  rawToken: string,
  expiresAt: Date
): Promise<{ userId: string; userName: string; email: string } | null> {
  const tokenHash = hashTokenSha256(rawToken);
  const now = new Date();

  return withAccountDb(
    async () => {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return null;

      await db.$transaction([
        db.emailVerificationToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: now },
        }),
        db.emailVerificationToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        }),
      ]);

      return { userId: user.id, userName: user.name, email: user.email };
    },
    () => {
      const store = readFallbackStore();
      const user = store.users.find((u) => u.id === userId);
      if (!user) return null;

      const nowIso = now.toISOString();
      store.verificationTokens = store.verificationTokens.map((t) =>
        t.userId === user.id && !t.usedAt ? { ...t, usedAt: nowIso } : t
      );
      store.verificationTokens.push({
        id: `evt-${Date.now().toString(36)}`,
        userId: user.id,
        tokenHash,
        expiresAt: expiresAt.toISOString(),
        usedAt: null,
        createdAt: nowIso,
      });
      writeFallbackStore(store);
      return { userId: user.id, userName: user.name, email: user.email };
    }
  );
}

export async function consumeEmailVerificationTokenRecord(
  rawToken: string
): Promise<{ ok: true; user: UserProfile } | { ok: false; reason: "EXPIRED" | "INVALID" }> {
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
    return { ok: false, reason: "INVALID" };
  }

  const tokenHash = hashTokenSha256(rawToken);
  const now = new Date();

  return withAccountDb(
    async () => {
      const token = await db.emailVerificationToken.findUnique({ where: { tokenHash } });
      if (!token || token.usedAt !== null) return { ok: false, reason: "INVALID" };
      if (token.expiresAt <= now) return { ok: false, reason: "EXPIRED" };

      const result = await db.$transaction(async (tx) => {
        const claimed = await tx.emailVerificationToken.updateMany({
          where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
          data: { usedAt: now },
        });
        if (claimed.count !== 1) return { ok: false as const, reason: "INVALID" as const };

        const updatedUser = await tx.user.update({
          where: { id: token.userId },
          data: { emailVerified: true, emailVerifiedAt: now },
          include: { department: { select: { name: true } } },
        });

        await tx.auditLog.create({
          data: {
            actorId: token.userId,
            action: "EMAIL_VERIFIED",
            entityType: "User",
            entityId: token.userId,
          },
        });

        return { ok: true as const, user: sanitizeUser(updatedUser) };
      });

      return result;
    },
    () => {
      const store = readFallbackStore();
      const token = store.verificationTokens.find((t) => t.tokenHash === tokenHash);
      if (!token || token.usedAt !== null) return { ok: false, reason: "INVALID" };
      if (new Date(token.expiresAt) <= now) return { ok: false, reason: "EXPIRED" };

      const nowIso = now.toISOString();
      store.verificationTokens = store.verificationTokens.map((t) =>
        t.userId === token.userId && !t.usedAt ? { ...t, usedAt: nowIso } : t
      );

      const userIdx = store.users.findIndex((u) => u.id === token.userId);
      if (userIdx === -1) return { ok: false, reason: "INVALID" };

      store.users[userIdx] = {
        ...store.users[userIdx],
        emailVerified: true,
        emailVerifiedAt: nowIso,
        updatedAt: nowIso,
      };
      writeFallbackStore(store);
      return { ok: true, user: sanitizeUser(store.users[userIdx]) };
    }
  );
}

export async function recordAuthAuditLog(
  actorId: string | null,
  action: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await withAccountDb(
      async () => {
        await db.auditLog.create({
          data: {
            actorId,
            action,
            entityType: "User",
            entityId,
            metadata: metadata ? (metadata as any) : undefined,
          },
        });
      },
      () => undefined
    );
  } catch {
    // Ignore audit log error gracefully
  }
}
