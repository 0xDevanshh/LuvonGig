interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private getKey(identifier: string, action: string): string {
    return `${action}:${identifier}`;
  }

  isAllowed(identifier: string, action: string = 'default'): boolean {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      // First attempt
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Window has expired, reset
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count >= this.config.maxAttempts) {
      return false;
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);
    return true;
  }

  getRemainingAttempts(identifier: string, action: string = 'default'): number {
    const key = this.getKey(identifier, action);
    const entry = this.store.get(key);

    if (!entry) {
      return this.config.maxAttempts;
    }

    if (Date.now() > entry.resetTime) {
      return this.config.maxAttempts;
    }

    return Math.max(0, this.config.maxAttempts - entry.count);
  }

  getResetTime(identifier: string, action: string = 'default'): number | null {
    const key = this.getKey(identifier, action);
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.resetTime) {
      return null;
    }

    return entry.resetTime;
  }

  reset(identifier: string, action: string = 'default'): void {
    const key = this.getKey(identifier, action);
    this.store.delete(key);
  }

  // Get all entries for debugging
  getAllEntries(): Array<{ key: string; entry: RateLimitEntry }> {
    return Array.from(this.store.entries()).map(([key, entry]) => ({ key, entry }));
  }
}

// Create rate limiters for different actions
export const otpRateLimiter = new RateLimiter({
  maxAttempts: 5, // Max 5 OTP requests per email per day
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
});

export const otpVerificationRateLimiter = new RateLimiter({
  maxAttempts: 5, // Max 5 verification attempts per OTP
  windowMs: 10 * 60 * 1000, // 10 minutes (OTP lifetime)
});

export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5, // Max 5 login attempts per IP
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const passwordResetRateLimiter = new RateLimiter({
  maxAttempts: 3, // Max 3 password reset requests per email per hour
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const generalRateLimiter = new RateLimiter({
  maxAttempts: 100, // Max 100 requests per IP per hour
  windowMs: 60 * 60 * 1000, // 1 hour
});

// Helper functions
export function checkOTPRateLimit(email: string): { allowed: boolean; remaining: number; resetTime: number | null } {
  const allowed = otpRateLimiter.isAllowed(email, 'otp-request');
  const remaining = otpRateLimiter.getRemainingAttempts(email, 'otp-request');
  const resetTime = otpRateLimiter.getResetTime(email, 'otp-request');
  
  return { allowed, remaining, resetTime };
}

export function checkOTPVerificationRateLimit(email: string): { allowed: boolean; remaining: number; resetTime: number | null } {
  const allowed = otpVerificationRateLimiter.isAllowed(email, 'otp-verify');
  const remaining = otpVerificationRateLimiter.getRemainingAttempts(email, 'otp-verify');
  const resetTime = otpVerificationRateLimiter.getResetTime(email, 'otp-verify');
  
  return { allowed, remaining, resetTime };
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number | null } {
  const allowed = loginRateLimiter.isAllowed(ip, 'login');
  const remaining = loginRateLimiter.getRemainingAttempts(ip, 'login');
  const resetTime = loginRateLimiter.getResetTime(ip, 'login');
  
  return { allowed, remaining, resetTime };
}

export function checkPasswordResetRateLimit(email: string): { allowed: boolean; remaining: number; resetTime: number | null } {
  const allowed = passwordResetRateLimiter.isAllowed(email, 'password-reset');
  const remaining = passwordResetRateLimiter.getRemainingAttempts(email, 'password-reset');
  const resetTime = passwordResetRateLimiter.getResetTime(email, 'password-reset');
  
  return { allowed, remaining, resetTime };
}

export function checkGeneralRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number | null } {
  const allowed = generalRateLimiter.isAllowed(ip, 'general');
  const remaining = generalRateLimiter.getRemainingAttempts(ip, 'general');
  const resetTime = generalRateLimiter.getResetTime(ip, 'general');
  
  return { allowed, remaining, resetTime };
}

// Reset functions
export function resetOTPRateLimit(email: string): void {
  otpRateLimiter.reset(email, 'otp-request');
}

export function resetOTPVerificationRateLimit(email: string): void {
  otpVerificationRateLimiter.reset(email, 'otp-verify');
}

export function resetLoginRateLimit(ip: string): void {
  loginRateLimiter.reset(ip, 'login');
}

export function resetPasswordResetRateLimit(email: string): void {
  passwordResetRateLimiter.reset(email, 'password-reset');
}

// Production recommendation
export const PRODUCTION_RECOMMENDATIONS = `
For production, consider using Redis for rate limiting:

1. Install Redis and ioredis:
   npm install ioredis
   npm install @types/ioredis

2. Create a Redis-based rate limiter:
   - Store rate limit data in Redis with TTL
   - Use Redis atomic operations for thread safety
   - Implement distributed rate limiting across multiple servers

3. Example Redis rate limiter structure:
   - Key: "rate_limit:{action}:{identifier}"
   - Value: JSON with count and reset time
   - TTL: Set to window duration

4. Benefits:
   - Persistent across server restarts
   - Shared across multiple server instances
   - Better performance for high-traffic applications
   - Built-in expiration handling
`;

export { RateLimiter };
