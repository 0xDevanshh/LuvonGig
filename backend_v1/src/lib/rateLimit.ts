/**
 * In-memory fixed-window rate limiting.
 *
 * This is a port of frontend/lib/rate-limit.ts, and it works properly here for
 * the first time: on Vercel each lambda held its own Map, so the limits were
 * mostly decorative. A single long-lived Express process actually enforces them.
 *
 * The tradeoff is explicit: counters live in this process, so they reset on
 * restart and are not shared between instances. That is fine for one instance.
 * Before scaling horizontally, move the store to Postgres or Redis — the
 * `RateLimiter` interface is the only thing that has to change.
 */

interface Entry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export class RateLimiter {
  private readonly store = new Map<string, Entry>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
    private readonly name: string,
  ) {}

  check(identifier: string): RateLimitResult {
    const key = `${this.name}:${identifier}`;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.maxAttempts - 1, resetAt, retryAfterSeconds: 0 };
    }

    if (entry.count >= this.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: this.maxAttempts - entry.count,
      resetAt: entry.resetAt,
      retryAfterSeconds: 0,
    };
  }

  /** Called after a success, so a legitimate user is not punished for earlier typos. */
  reset(identifier: string): void {
    this.store.delete(`${this.name}:${identifier}`);
  }

  /** Drops expired entries so the map cannot grow without bound. */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) this.store.delete(key);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

// Windows match the current frontend limiter.
export const otpRequestLimiter = new RateLimiter(3, 15 * 60_000, 'otp-request');
export const otpVerifyLimiter = new RateLimiter(5, 15 * 60_000, 'otp-verify');
export const loginLimiter = new RateLimiter(5, 15 * 60_000, 'login');
export const passwordResetLimiter = new RateLimiter(3, 60 * 60_000, 'password-reset');

const ALL = [otpRequestLimiter, otpVerifyLimiter, loginLimiter, passwordResetLimiter];

const pruneTimer = setInterval(() => {
  for (const limiter of ALL) limiter.prune();
}, 5 * 60_000);
// Do not hold the event loop open on shutdown.
pruneTimer.unref();

/** Client IP, honouring the proxy headers the app already sits behind. */
export function clientIp(headers: Record<string, unknown>, fallback?: string): string {
  const forwarded = headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim();
  }
  const real = headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) return real;
  return fallback || 'unknown';
}
