'use server';

/**
 * Server actions for the profile.
 *
 * Previously read and wrote the user canister directly. They now call the API,
 * which owns the profile rules and derives the account from the session — the
 * canister version took a user id from the caller.
 */
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** The profile as the API returns it. Typed so callers get real strings. */
export interface ProfileFields {
  firstName: string;
  lastName: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  profileImageUrl: string | null;
  resumeUrl: string | null;
  skills: string[];
  experience: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
}

interface ProfileResult {
  success: boolean;
  /** The profile fields, matching the shape the pages already read. */
  profile?: ProfileFields | null;
  /** The whole user record, for callers that want email or verification state. */
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
}

async function callApi(path: string, method: 'GET' | 'POST', body?: unknown): Promise<ProfileResult> {
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
    // The API answers { success, data: { id, email, profile } }. Pages read
    // `result.profile`, so unwrap rather than making every caller reach in.
    const record = (data.data ?? {}) as Record<string, unknown>;
    return {
      success: true,
      message: typeof data.message === 'string' ? data.message : 'Saved',
      data: record,
      profile: (record.profile ?? null) as ProfileFields | null,
    };
  } catch {
    return { success: false, error: 'Could not reach the server. Please try again.' };
  }
}

/** The signed-in user's profile. No id argument: it comes from the session. */
export async function getProfileAction(): Promise<ProfileResult> {
  return callApi('/api/user/profile', 'GET');
}

export async function updateProfileAction(
  input: FormData | Record<string, unknown>,
): Promise<ProfileResult> {
  // Pages submit a FormData; the API takes JSON.
  const body = input instanceof FormData
    ? Object.fromEntries(input.entries())
    : input;
  return callApi('/api/user/settings/profile', 'POST', body);
}
