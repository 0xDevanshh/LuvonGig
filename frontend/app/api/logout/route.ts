import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await clearSession();

    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sid');

    // Also clear onboarding completion flag on logout
    // This ensures fresh start when user logs back in
    response.headers.set('Set-Cookie', 'onboarding_completed=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
