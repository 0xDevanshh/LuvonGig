import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { unauthorized, forbidden } from '../lib/errors.js';
import { verifySessionToken, type SessionData } from '../lib/session.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionData;
    }
  }
}

function readToken(req: Parameters<RequestHandler>[0]): string | null {
  const cookieToken = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken;

  // Bearer fallback, for the Socket.IO handshake and server-to-server calls.
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
}

/**
 * Attaches `req.user` when a valid session is present, but never rejects.
 * For endpoints that behave differently when signed in — browsing services,
 * viewing a public profile.
 */
export const attachUser: RequestHandler = async (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    const claims = await verifySessionToken(token);
    if (claims) {
      req.user = { userId: claims.userId, email: claims.email, isVerified: claims.isVerified };
    }
  }
  next();
};

/**
 * Rejects anything without a valid session.
 *
 * This replaces the per-route `getSession()` call repeated across the Next.js
 * API routes — and, more importantly, makes it impossible to forget. Ownership
 * is still each route's job: authenticated is not authorized. Scope every
 * mutating query by `req.user.userId`.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next(unauthorized('You must be logged in to do that.'));

  const claims = await verifySessionToken(token);
  if (!claims) return next(unauthorized('Your session has expired. Please log in again.'));

  req.user = { userId: claims.userId, email: claims.email, isVerified: claims.isVerified };
  next();
};

/** For actions gated behind email verification. Use after `requireAuth`. */
export const requireVerified: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!req.user.isVerified) {
    return next(forbidden('Please verify your email address to continue.'));
  }
  next();
};
