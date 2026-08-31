/**
 * Client-side Authentication Utilities
 * For use in client components and browser environment
 * Uses localStorage/sessionStorage instead of cookies
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
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

// Password hashing functions are removed from client-side auth
// Password hashing should only be done on the server for security reasons
// Use the API endpoints for password operations

// JWT token creation (for client-side validation)
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

// JWT token verification (client-side)
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

// Session management (client-side using localStorage)
export async function createSession(sessionData: SessionData): Promise<string> {
  try {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: sessionData.userId,
      email: sessionData.email,
      isVerified: sessionData.isVerified,
    };

    const token = await createJWT(payload);

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('sid', token);
    }

    return token;
  } catch (error) {
    console.error('Session creation error:', error);
    throw new Error('Failed to create session');
  }
}

export async function getSession(): Promise<SessionData | null> {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const sessionToken = localStorage.getItem('sid');

    if (!sessionToken) {
      return null;
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload) {
      // Remove invalid token
      localStorage.removeItem('sid');
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      isVerified: payload.isVerified,
    };
  } catch (error) {
    console.error('Session retrieval error:', error);
    // Clear potentially corrupted session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sid');
    }
    return null;
  }
}

export function clearSession(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sid');
      // Also clear session storage
      sessionStorage.removeItem('sid');
    }
  } catch (error) {
    console.error('Session clear error:', error);
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null && session.isVerified;
}

// Get current user info
export async function getCurrentUser(): Promise<SessionData | null> {
  return await getSession();
}

// Password reset token (client-side)
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

// Client-side auth object for compatibility
export const authClient = {
  createSession,
  getSession,
  clearSession,
  createJWT,
  verifyJWT,
  createPasswordResetToken,
  verifyPasswordResetToken,
  generateOTP,
  generateUserId,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  isTokenExpired,
  isAuthenticated,
  getCurrentUser
};

export default authClient;