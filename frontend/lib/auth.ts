import { SignJWT, jwtVerify } from 'jose';
import argon2 from 'argon2';
import { cookies } from 'next/headers';

/**
 * No fallback, deliberately.
 *
 * This previously defaulted to a literal committed to the repository, so an
 * environment that forgot to set JWT_SECRET signed its sessions with a value
 * anyone reading the source could use to forge a token for any account. A
 * missing secret must stop the process, not quietly downgrade it to a public
 * one.
 */
function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short (needs at least 32 characters). ' +
        'Sessions cannot be signed safely without it.',
    );
  }
  return secret;
}

const JWT_SECRET = requireJwtSecret();
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  isVerified: boolean;
  iat: number;
  exp: number;
}

export interface SessionData {
  userId: string;
  email: string;
  isVerified: boolean;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// JWT token creation
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    return jwt;
  } catch (error) {
    console.error('JWT creation error:', error);
    throw new Error('Failed to create JWT token');
  }
}

// JWT token verification
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Session management
export async function createSession(sessionData: SessionData): Promise<string> {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: sessionData.userId,
    email: sessionData.email,
    isVerified: sessionData.isVerified,
  };

  return createJWT(payload);
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('sid')?.value;

    if (!sessionToken) {
      return null;
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      isVerified: payload.isVerified,
    };
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('sid');
  } catch (error) {
    console.error('Session clear error:', error);
  }
}

// Password reset token
export async function createPasswordResetToken(userId: string): Promise<string> {
  const payload = {
    userId,
    type: 'password-reset',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  };

  return createJWT(payload as any);
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const payload = await verifyJWT(token);
    if (!payload || (payload as any).type !== 'password-reset') {
      return null;
    }
    return (payload as any).userId;
  } catch (error) {
    return null;
  }
}

// Generate random OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate random user ID (Stripe-style: user_ + 21 chars)
export function generateUserId(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const size = 21;
  let result = 'user_';
  for (let i = 0; i < size; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Check if JWT is expired
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

// Auth object for compatibility
export const auth = {
  createSession,
  getSession,
  clearSession,
  createJWT,
  verifyJWT,
  hashPassword,
  verifyPassword,
  createPasswordResetToken,
  verifyPasswordResetToken,
  generateOTP,
  generateUserId,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  isTokenExpired
};
