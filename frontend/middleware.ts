import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Pages that require a session.
 *
 * This previously listed only /dashboard and /profile, which left every
 * /freelancer/* and /client/* page — the entire signed-in application —
 * reachable without one. The API routes behind them do enforce authentication,
 * so this was not a data leak, but a signed-out visitor got a broken shell of
 * a page and a burst of failed requests instead of a login redirect.
 *
 * Note this is a redirect for humans, not an authorization boundary. The
 * cookie's presence is checked, not its signature — verifying the JWT here
 * would run on every navigation. Authorization belongs to the API, which
 * verifies the session on every request.
 */
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/freelancer',
  '/client',
  '/admin',
  '/onboarding',
  '/expert/dashboard',
  '/expert/register',
];

/**
 * Carved out of the prefixes above: marketplace discovery is public by design.
 * The services, jobs and hackathon list endpoints use optional authentication
 * (`attachUser`, not `requireAuth`) precisely so a signed-out visitor can
 * browse before creating an account. Gating these would be a product
 * regression dressed up as a security fix.
 */
const publicRoutes = [
  '/client/browse-services',
  '/client/service',
  '/client/hackathons',
];

const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Public routes win over the protected prefixes they sit inside.
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    const isProtectedRoute =
      !isPublicRoute && protectedRoutes.some(route => pathname.startsWith(route));

    // Check if the route is an auth route
    const isAuthRoute = authRoutes.some(route =>
      pathname.startsWith(route)
    );

    // Get the session token from cookies
    const sessionToken = request.cookies.get('sid')?.value;

    // If it's a protected route and no session token, redirect to login
    if (isProtectedRoute && !sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If it's an auth route and user has a session token, redirect to freelancer dashboard
    if (isAuthRoute && sessionToken) {
      return NextResponse.redirect(new URL('/freelancer/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Log error and allow request to continue
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
