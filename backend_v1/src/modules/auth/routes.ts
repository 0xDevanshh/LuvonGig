/**
 * Auth routes.
 *
 * RESPONSE SHAPES ARE LOAD-BEARING. These endpoints do not use the standard
 * `{ success, data }` envelope — the existing frontend reads `data.session.userId`
 * (app/freelancer/my-services/page.tsx), `result.user`, and `result.userId`
 * directly. Every shape here is copied from the Next.js route it replaces.
 * Changing one breaks pages that are still on the old code path.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { env } from '../../config/env.js';
import { badRequest, conflict, unauthorized } from '../../lib/errors.js';
import { generateOtp, newUserId } from '../../lib/ids.js';
import { logger } from '../../lib/logger.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  clientIp, loginLimiter, otpRequestLimiter, otpVerifyLimiter, passwordResetLimiter,
} from '../../lib/rateLimit.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../../lib/email.js';
import { clearSessionCookie, createSessionToken, setSessionCookie } from '../../lib/session.js';
import { attachUser, requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import {
  forgotPasswordSchema, loginSchema, otpSchema, resendOtpSchema,
  resetPasswordSchema, signupSchema,
} from './schema.js';

export const authRouter = Router();

/** Constant-time compare, so a wrong OTP cannot be found one digit at a time. */
function codesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

authRouter.post('/signup', validateBody(signupSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const limit = otpRequestLimiter.check(email);
    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfterSeconds));
      return res.status(429).json({
        success: false,
        error: `Too many verification requests. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      });
    }

    if (await repo.findByEmail(email)) {
      return next(conflict('User with this email already exists'));
    }

    const userId = newUserId();
    await repo.createUser(userId, email, await hashPassword(password));

    const code = generateOtp();
    await repo.upsertOtp(email, code);
    await sendOtpEmail(email, code);

    res.json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      userId,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/verify-otp', validateBody(otpSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const limit = otpVerifyLimiter.check(email);
    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfterSeconds));
      return res.status(429).json({
        success: false,
        error: 'Too many attempts. Please request a new code.',
      });
    }

    const record = await repo.findOtp(email);
    if (!record) return next(badRequest('No verification code found. Please request a new one.'));

    if (new Date(record.expires_at).getTime() < Date.now()) {
      await repo.deleteOtp(email);
      return next(badRequest('That code has expired. Please request a new one.'));
    }

    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      await repo.deleteOtp(email);
      return next(badRequest('Too many incorrect attempts. Please request a new code.'));
    }

    if (!codesMatch(record.code, otp)) {
      const attempts = await repo.bumpOtpAttempts(email);
      const left = Math.max(0, env.OTP_MAX_ATTEMPTS - attempts);
      return next(badRequest(
        left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
                 : 'Too many incorrect attempts. Please request a new code.',
      ));
    }

    const user = await repo.findByEmail(email);
    if (!user) return next(badRequest('Account not found.'));

    await repo.markVerified(user.id);
    await repo.deleteOtp(email);
    otpVerifyLimiter.reset(email);
    otpRequestLimiter.reset(email);

    // Verifying signs you in — the old route set the cookie here too.
    setSessionCookie(res, await createSessionToken({
      userId: user.id, email: user.email, isVerified: true,
    }));

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/resend-otp', validateBody(resendOtpSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    const limit = otpRequestLimiter.check(email);
    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfterSeconds));
      return res.status(429).json({
        success: false,
        error: `Too many verification requests. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      });
    }

    const user = await repo.findByEmail(email);
    // Don't confirm or deny that the account exists.
    if (user && !user.is_verified) {
      const code = generateOtp();
      await repo.upsertOtp(email, code);
      await sendOtpEmail(email, code);
    }

    res.json({ success: true, message: 'If that account needs verification, a new code has been sent.' });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = clientIp(req.headers as Record<string, unknown>, req.ip);

    const limit = loginLimiter.check(ip);
    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfterSeconds));
      return res.status(429).json({
        success: false,
        error: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      });
    }

    const user = await repo.findByEmail(email);

    // Same message and status whether the account is missing or the password
    // is wrong, so this cannot be used to enumerate accounts.
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return next(unauthorized('Invalid email or password'));
    }

    if (!user.is_verified) {
      return next(unauthorized('Please verify your email before logging in'));
    }

    await repo.touchLastLogin(user.id);
    loginLimiter.reset(ip);

    setSessionCookie(res, await createSessionToken({
      userId: user.id, email: user.email, isVerified: user.is_verified,
    }));

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, isVerified: user.is_verified },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

/** `{ success, session }` — not the standard envelope. See the file header. */
authRouter.get('/session', attachUser, (req, res) => {
  if (!req.user) {
    return res.json({ success: false, error: 'No active session' });
  }
  res.json({
    success: true,
    session: { userId: req.user.userId, email: req.user.email, isAuthenticated: true },
  });
});

authRouter.get('/me', attachUser, (req, res) => {
  if (!req.user) {
    return res.json({ success: false, error: 'No active session', session: null });
  }
  res.json({
    success: true,
    message: 'Active session found',
    session: {
      userId: req.user.userId,
      email: req.user.email,
      isVerified: req.user.isVerified,
    },
  });
});

authRouter.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    const limit = passwordResetLimiter.check(email);
    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfterSeconds));
      return res.status(429).json({
        success: false,
        error: 'Too many reset requests. Please try again later.',
      });
    }

    const user = await repo.findByEmail(email);
    if (user) {
      const token = randomBytes(32).toString('base64url');
      await repo.createResetToken(user.id, token);
      await sendPasswordResetEmail(email, `${env.APP_URL}/reset-password?token=${token}`);
    } else {
      logger.info({ email }, 'Password reset requested for unknown account');
    }

    // Identical response either way — otherwise this endpoint tells an
    // attacker which email addresses have accounts.
    res.json({
      success: true,
      message: 'If an account exists for that address, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * New route. The old app had no /api/auth/reset-password — it went through the
 * resetPasswordAction server action in frontend/lib/actions/auth.ts.
 */
authRouter.post('/reset-password', validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const record = await repo.findResetToken(token);
    if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
      return next(badRequest('That reset link is invalid or has expired. Please request a new one.'));
    }

    await repo.updatePasswordHash(record.user_id, await hashPassword(password));
    await repo.consumeResetToken(token);
    // Any other outstanding link is now stale.
    await repo.invalidateResetTokens(record.user_id);

    // Force a fresh login rather than silently re-authenticating.
    clearSessionCookie(res);

    res.json({ success: true, message: 'Password updated. Please log in.' });
  } catch (err) {
    next(err);
  }
});

/** Kept on the auth router because it needs the current password. */
authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { changePasswordSchema } = await import('./schema.js');
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await repo.findById(req.user!.userId);
    if (!user) return next(unauthorized());

    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      return next(badRequest('Your current password is incorrect'));
    }

    await repo.updatePasswordHash(user.id, await hashPassword(newPassword));
    await repo.invalidateResetTokens(user.id);

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
});
