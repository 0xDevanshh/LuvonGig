import { NextRequest, NextResponse } from 'next/server';

/**
 * Forwards a Next.js API route to the Express backend during the migration.
 *
 * Each ported route becomes a one-liner calling this, so no page or component
 * changes while a domain moves over. Cookies travel in both directions, which
 * is what lets Express set the `sid` session on the browser through this hop.
 *
 * Every proxy here is deleted in Phase 7, once the frontend calls the API
 * directly.
 */

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * To roll a route back to its canister implementation, recover the file from
 * git history (`git show <commit>:<path> > <path>`). Copies of the originals
 * used to sit beside each proxy as `.canister.ts.bak`; they were 10k lines of
 * duplicated dead code that git already stored, so they were removed.
 */

export async function proxy(request: NextRequest, targetPath: string): Promise<NextResponse> {
  const url = new URL(targetPath, API_URL);
  url.search = request.nextUrl.search;

  const headers = new Headers();
  // Forward only what the backend needs. Copying wholesale would carry `host`
  // and `content-length`, which then disagree with the new request.
  for (const name of ['content-type', 'cookie', 'authorization', 'accept', 'user-agent']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Preserve the caller's IP so rate limits key on the user, not on Next.js.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) headers.set('x-forwarded-for', forwarded);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch (error) {
    console.error(`[proxy] ${request.method} ${targetPath} failed:`, error);
    return NextResponse.json(
      { success: false, error: 'The service is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }

  const body = await upstream.text();
  const response = new NextResponse(body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });

  // Session cookies are the whole point of the hop — getSetCookie() keeps
  // multiple Set-Cookie headers separate, which joining them would corrupt.
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie);
  }

  const retryAfter = upstream.headers.get('retry-after');
  if (retryAfter) response.headers.set('retry-after', retryAfter);

  return response;
}
