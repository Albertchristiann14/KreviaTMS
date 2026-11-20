import { verify as verifyArgon2 } from "@node-rs/argon2";
import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { PermissionCode, RoleCode } from "@/lib/constants/permissions";
import { prisma } from "@/server/db/prisma";
import { authConfig } from "@/server/auth/auth.config";

const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS = 20;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAP_MAX_KEYS = 10_000;

// Precomputed cost-12 bcrypt hash for constant-time dummy verification when email is not found
const DUMMY_BCRYPT_HASH =
  "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid.")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password wajib diisi."),
});

class RateLimitedCredentialsError extends CredentialsSignin {
  override code = "rate_limited";
}

class AccountInactiveCredentialsError extends CredentialsSignin {
  override code = "account_inactive";
}

// Module-level sliding window store for failed credential attempts per email+IP.
const globalForRateLimit = globalThis as unknown as {
  ktmsLoginAttempts?: Map<string, number[]>;
};

const loginAttemptsStore: Map<string, number[]> =
  globalForRateLimit.ktmsLoginAttempts ?? new Map<string, number[]>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.ktmsLoginAttempts = loginAttemptsStore;
}

function getClientIp(request: Request | undefined): string {
  if (!request) return "unknown";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function buildRateLimitKey(email: string, ip: string): string {
  return `${email}::${ip}`;
}

function buildIpRateLimitKey(ip: string): string {
  return `ip::${ip}`;
}

function pruneAttempts(timestamps: number[], now: number): number[] {
  return timestamps.filter((ts) => now - ts < LOGIN_RATE_LIMIT_WINDOW_MS);
}

function isKeyRateLimited(
  key: string,
  now: number,
  maxAttempts: number
): boolean {
  const existing = loginAttemptsStore.get(key);
  if (!existing) return false;

  const active = pruneAttempts(existing, now);
  if (active.length === 0) {
    loginAttemptsStore.delete(key);
    return false;
  }

  loginAttemptsStore.set(key, active);
  return active.length >= maxAttempts;
}

function isLoginRateLimited(emailKey: string, ip: string, now: number): boolean {
  const emailLimited = isKeyRateLimited(
    emailKey,
    now,
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS
  );
  const ipLimited =
    ip !== "unknown" &&
    isKeyRateLimited(
      buildIpRateLimitKey(ip),
      now,
      LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS
    );
  return emailLimited || ipLimited;
}

function recordKeyAttempt(key: string, now: number): void {
  if (
    loginAttemptsStore.size >= RATE_LIMIT_MAP_MAX_KEYS &&
    !loginAttemptsStore.has(key)
  ) {
    const oldestKey = loginAttemptsStore.keys().next().value;
    if (oldestKey) {
      loginAttemptsStore.delete(oldestKey);
    }
  }
  const existing = loginAttemptsStore.get(key) ?? [];
  const active = pruneAttempts(existing, now);
  active.push(now);
  loginAttemptsStore.set(key, active);
}

function recordFailedAttempt(emailKey: string, ip: string, now: number): void {
  recordKeyAttempt(emailKey, now);
  if (ip !== "unknown") {
    recordKeyAttempt(buildIpRateLimitKey(ip), now);
  }
}

function clearFailedAttempts(key: string): void {
  loginAttemptsStore.delete(key);
}

async function verifyPasswordHash(
  storedHash: string,
  plainPassword: string
): Promise<boolean> {
  try {
    if (storedHash.startsWith("$2")) {
      return await bcrypt.compare(plainPassword, storedHash);
    }
    return await verifyArgon2(storedHash, plainPassword);
  } catch {
    return false;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const ip = getClientIp(request);
        const rateKey = buildRateLimitKey(email, ip);
        const now = Date.now();

        if (isLoginRateLimited(rateKey, ip, now)) {
          throw new RateLimitedCredentialsError();
        }

        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            jobTitle: true,
            department: true,
            passwordHash: true,
            isActive: true,
            deletedAt: true,
            tokenVersion: true,
            roleId: true,
            role: {
              select: {
                code: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: { code: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!dbUser || dbUser.deletedAt !== null) {
          await verifyPasswordHash(DUMMY_BCRYPT_HASH, password);
          recordFailedAttempt(rateKey, ip, now);
          return null;
        }

        const isPasswordValid = await verifyPasswordHash(
          dbUser.passwordHash,
          password
        );

        if (!isPasswordValid) {
          recordFailedAttempt(rateKey, ip, now);
          return null;
        }

        if (!dbUser.isActive) {
          recordFailedAttempt(rateKey, ip, now);
          throw new AccountInactiveCredentialsError();
        }

        clearFailedAttempts(rateKey);

        await prisma.user.update({
          where: { id: dbUser.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.fullName,
          avatarUrl: dbUser.avatarUrl,
          jobTitle: dbUser.jobTitle,
          department: dbUser.department,
          role: dbUser.role.code as RoleCode,
          roleId: dbUser.roleId,
          tokenVersion: dbUser.tokenVersion,
          permissions: dbUser.role.rolePermissions.map(
            (rp) => rp.permission.code as PermissionCode
          ),
        };
      },
    }),
  ],
});
