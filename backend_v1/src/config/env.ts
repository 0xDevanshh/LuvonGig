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
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // Fail fast and loudly: a half-configured API is worse than one that won't boot.
  console.error(`Invalid environment configuration:\n${issues}\n`);
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
