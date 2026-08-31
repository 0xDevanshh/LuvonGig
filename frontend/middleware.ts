import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = ['/dashboard', '/profile'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    );

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
