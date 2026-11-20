import { z } from "zod";

function emptyStringToUndefined(val: unknown): unknown {
  if (typeof val === "string" && val.trim() === "") {
    return undefined;
  }
  return val;
}

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi."),
  DIRECT_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional()
  ),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET minimal 16 karakter."),
  AUTH_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  AUTH_TRUST_HOST: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["supabase", "s3"]).default("supabase"),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional()
  ),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("ktms-media"),
  CRON_SECRET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional()
  ),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ENABLE_DEMO_HINTS: z
    .enum(["true", "false"])
    .optional()
    .default("false"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .default("https://placeholder.supabase.co"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;
let cachedPublicEnv: PublicEnv | null = null;

function isValidationSkipped(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "1";
}

/**
 * Lazily validates and returns server-side environment variables.
 * Safe during `next build` when `SKIP_ENV_VALIDATION === "1"`.
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  if (isValidationSkipped()) {
    cachedServerEnv = {
      NODE_ENV:
        (process.env.NODE_ENV as ServerEnv["NODE_ENV"] | undefined) ??
        "production",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/postgres",
      DIRECT_URL: emptyStringToUndefined(process.env.DIRECT_URL) as
        | string
        | undefined,
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        "ci-build-only-placeholder-secret-32-chars",
      AUTH_URL: emptyStringToUndefined(process.env.AUTH_URL) as
        | string
        | undefined,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      STORAGE_PROVIDER:
        (process.env.STORAGE_PROVIDER as ServerEnv["STORAGE_PROVIDER"] | undefined) ??
        "supabase",
      SUPABASE_SERVICE_ROLE_KEY: emptyStringToUndefined(
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) as string | undefined,
      SUPABASE_STORAGE_BUCKET:
        process.env.SUPABASE_STORAGE_BUCKET ?? "ktms-media",
      CRON_SECRET: emptyStringToUndefined(process.env.CRON_SECRET) as
        | string
        | undefined,
    };
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`[KTMS_ENV_ERROR] Konfigurasi environment server tidak valid: ${issues}`);
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/**
 * Lazily validates and returns public NEXT_PUBLIC_* environment variables.
 */
export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) return cachedPublicEnv;

  const raw = {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENABLE_DEMO_HINTS: process.env.NEXT_PUBLIC_ENABLE_DEMO_HINTS,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  if (isValidationSkipped()) {
    cachedPublicEnv = {
      NEXT_PUBLIC_APP_ENV:
        (raw.NEXT_PUBLIC_APP_ENV as PublicEnv["NEXT_PUBLIC_APP_ENV"] | undefined) ??
        "development",
      NEXT_PUBLIC_APP_URL: raw.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_ENABLE_DEMO_HINTS:
        (raw.NEXT_PUBLIC_ENABLE_DEMO_HINTS as PublicEnv["NEXT_PUBLIC_ENABLE_DEMO_HINTS"] | undefined) ??
        "false",
      NEXT_PUBLIC_SUPABASE_URL:
        raw.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    };
    return cachedPublicEnv;
  }

  const parsed = publicEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`[KTMS_ENV_ERROR] Konfigurasi environment publik tidak valid: ${issues}`);
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}

/**
 * Lazy accessor combining server and public environment properties on demand.
 */
export const env: ServerEnv & PublicEnv = new Proxy(
  {} as ServerEnv & PublicEnv,
  {
    get(_target, prop: string) {
      if (prop.startsWith("NEXT_PUBLIC_")) {
        return getPublicEnv()[prop as keyof PublicEnv];
      }
      return getServerEnv()[prop as keyof ServerEnv];
    },
  }
);
