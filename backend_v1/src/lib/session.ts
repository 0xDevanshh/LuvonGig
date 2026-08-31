import { SignJWT, jwtVerify } from 'jose';
import type { Response } from 'express';
import { env } from '../config/env.js';

/**
 * Deliberately byte-compatible with frontend/lib/auth.ts: same HS256 algorithm,
 * same `{ userId, email, isVerified }` claims, same 7-day expiry, same `sid`
 * httpOnly cookie. As long as JWT_SECRET matches, a session minted by the
 * Next.js app verifies here and vice versa — which is what lets routes move
 * over one domain at a time without logging anybody out.
 */

const ALGORITHM = 'HS256';
const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface SessionData {
  userId: string;
  email: string;
  isVerified: boolean;
}

export interface SessionClaims extends SessionData {
  iat: number;
  exp: number;
}

export async function createSessionToken(session: SessionData): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALGORITHM] });
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') return null;
    return {
      userId: payload.userId,
      email: payload.email,
      isVerified: Boolean(payload.isVerified),
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    // Expired, tampered with, or signed by a different secret — all "no session".
    return null;
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    // 'lax' keeps the cookie on top-level navigations back from Stripe Checkout
    // and email verification links. Cross-site XHR from another origin needs
    // 'none' + secure, which is only safe once the API is on HTTPS.
    sameSite: env.isProduction ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: SEVEN_DAYS_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
}
