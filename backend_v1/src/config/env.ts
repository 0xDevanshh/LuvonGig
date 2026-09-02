import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_UNPOOLED: z.string().optional(),

  // Must match the frontend's JWT_SECRET while Next.js routes proxy to this API,
  // otherwise sessions minted on either side will not verify on the other.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_COOKIE_NAME: z.string().default('sid'),
  COOKIE_DOMAIN: z.string().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Where password-reset links point. The frontend, not this API.
  APP_URL: z.string().default('http://localhost:3000'),

  // SMTP. Optional in development — email falls back to logging; required in
  // production, where a silently-unsent password reset is worse than an error.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Stripe. Optional so the API boots without payment keys — the payment
  // routes return 503 rather than the whole service failing to start.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PLATFORM_CURRENCY: z.string().length(3).default('USD'),

  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
});

const isTestRun = Boolean(process.env.VITEST);

/**
 * Values substituted only under Vitest, and only for variables the environment
 * does not already supply.
 *
 * Every test file imports this module transitively (via app.ts), including the
 * suites that skip themselves when there is no database. Exiting the process
 * here fails *collection* for all of them, so `npm test` without a
 * DATABASE_URL reported six failed suites rather than the hermetic unit run the
 * skips were written for.
 *
 * The database placeholder deliberately points at nothing: the test files
 * derive `hasDb` from process.env directly, so filling this in does not make a
 * database-less run look like it has one, and anything that does try to connect
 * fails at the point of use instead of at import.
 */
const TEST_FALLBACKS: Record<string, string> = {
  DATABASE_URL: 'postgres://placeholder.invalid/none',
  JWT_SECRET: 'test-only-secret-at-least-32-characters',
};

let parsed = schema.safeParse(process.env);

if (!parsed.success && isTestRun) {
  const filled: Record<string, string | undefined> = { ...process.env };
  for (const [key, value] of Object.entries(TEST_FALLBACKS)) {
    if (!filled[key]) filled[key] = value;
  }
  parsed = schema.safeParse(filled);
}

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  const message = `Invalid environment configuration:\n${issues}\n`;
  // A test run wants the failure attributed to the importing file, not a bare
  // "process.exit unexpectedly called".
  if (isTestRun) throw new Error(message);
  // Fail fast and loudly: a half-configured API is worse than one that won't boot.
  console.error(message);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  /** Session-mode connection, for migrations and anything needing advisory locks. */
  migrationDatabaseUrl: raw.DATABASE_URL_UNPOOLED || raw.DATABASE_URL,
} as const;

export type Env = typeof env;
