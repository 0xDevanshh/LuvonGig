'use server';

/**
 * Server actions for auth.
 *
 * These used to talk to the user canister directly through `getUserActor()`.
 * They are now thin wrappers over the API, which is the single place the rules
 * live — password hashing, OTP attempt limits, rate limiting and session
 * issuance. Duplicating any of that here is how two code paths drift apart.
 *
 * Only the actions still imported by a page or component are kept; the rest
 * were superseded by the API routes in Phase 2.
 */
import { cookies } from 'next/headers';
import { getSession, type SessionData } from '@/lib/auth';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/** Forwards the caller's session so the API can identify them. */
async function callApi(path: string, body?: unknown, method = 'POST'): Promise<ActionResult> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      return { success: false, error: data.error ?? 'Request failed. Please try again.' };
    }
    return { success: true, message: data.message };
  } catch {
    return { success: false, error: 'Could not reach the server. Please try again.' };
  }
}

export async function getCurrentSession(): Promise<SessionData | null> {
  // Read straight from the cookie: this is a local verification, and a network
  // round trip on every render would be wasteful.
  return getSession();
}

export async function verifyOTPAction(formData: FormData): Promise<ActionResult> {
  return callApi('/api/auth/verify-otp', {
    email: String(formData.get('email') ?? ''),
    otp: String(formData.get('otp') ?? formData.get('code') ?? ''),
  });
}

export async function resendOTPAction(formData: FormData): Promise<ActionResult> {
  return callApi('/api/auth/resend-otp', {
    email: String(formData.get('email') ?? ''),
  });
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  return callApi('/api/auth/reset-password', {
    token: String(formData.get('token') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
}
