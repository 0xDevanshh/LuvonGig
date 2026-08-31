import { createHash } from 'node:crypto';
import { query, queryOne } from '../../db/pool.js';
import { env } from '../../config/env.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  is_verified: boolean;
  profile_submitted: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT id, email::text AS email, password_hash, is_verified, profile_submitted,
            created_at, last_login_at
       FROM users WHERE email = $1`,
    [email],
  );
}

export async function findById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT id, email::text AS email, password_hash, is_verified, profile_submitted,
            created_at, last_login_at
       FROM users WHERE id = $1`,
    [id],
  );
}

export async function createUser(id: string, email: string, passwordHash: string): Promise<void> {
  await query('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [
    id, email, passwordHash,
  ]);
}

export async function markVerified(userId: string): Promise<void> {
  await query('UPDATE users SET is_verified = true WHERE id = $1', [userId]);
}

export async function touchLastLogin(userId: string): Promise<void> {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
}

export async function updatePasswordHash(userId: string, hash: string): Promise<void> {
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
}

// --- OTP -------------------------------------------------------------------

export interface OtpRow {
  email: string;
  code: string;
  attempts: number;
  expires_at: Date;
}

/**
 * One live OTP per email — a new request replaces the old one and resets the
 * attempt counter, matching the canister's single-slot behaviour.
 */
export async function upsertOtp(email: string, code: string): Promise<void> {
  await query(
    `INSERT INTO otp_codes (email, code, attempts, expires_at)
     VALUES ($1, $2, 0, now() + ($3 || ' minutes')::interval)
     ON CONFLICT (email) DO UPDATE SET
       code = EXCLUDED.code, attempts = 0, expires_at = EXCLUDED.expires_at, created_at = now()`,
    [email, code, String(env.OTP_TTL_MINUTES)],
  );
}

export async function findOtp(email: string): Promise<OtpRow | null> {
  return queryOne<OtpRow>(
    'SELECT email::text AS email, code, attempts, expires_at FROM otp_codes WHERE email = $1',
    [email],
  );
}

/** Returns the new attempt count, so the caller can enforce a ceiling. */
export async function bumpOtpAttempts(email: string): Promise<number> {
  const row = await queryOne<{ attempts: number }>(
    'UPDATE otp_codes SET attempts = attempts + 1 WHERE email = $1 RETURNING attempts',
    [email],
  );
  return row?.attempts ?? 0;
}

export async function deleteOtp(email: string): Promise<void> {
  await query('DELETE FROM otp_codes WHERE email = $1', [email]);
}

// --- Password reset --------------------------------------------------------

/**
 * Only the hash of the token is stored. A leaked table must not hand an
 * attacker working reset links.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createResetToken(userId: string, token: string): Promise<void> {
  await query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [hashToken(token), userId, String(env.PASSWORD_RESET_TTL_MINUTES)],
  );
}

export interface ResetTokenRow {
  token_hash: string;
  user_id: string;
  expires_at: Date;
  used_at: Date | null;
}

export async function findResetToken(token: string): Promise<ResetTokenRow | null> {
  return queryOne<ResetTokenRow>(
    'SELECT token_hash, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1',
    [hashToken(token)],
  );
}

export async function consumeResetToken(token: string): Promise<void> {
  await query('UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1', [
    hashToken(token),
  ]);
}

/** Invalidates every outstanding reset link for a user after a password change. */
export async function invalidateResetTokens(userId: string): Promise<void> {
  await query(
    'UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL',
    [userId],
  );
}
