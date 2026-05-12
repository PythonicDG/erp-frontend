import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicPaths = ['/login', '/'];

// Role-specific route prefixes
const roleRoutes: Record<string, string> = {
  '/admin': 'ADMIN',
  '/supervisor': 'SUPERVISOR',
  '/employee': 'EMPLOYEE',
};

/**
 * Next.js 16 Proxy (formerly Middleware)
 *
 * Handles:
 * 1. Redirect unauthenticated users to /login for protected routes
 * 2. Redirect authenticated users away from /login to their dashboard
 *
 * Note: Full role validation happens client-side in DashboardShell.
 * The proxy does an optimistic cookie check only — it does NOT validate
 * JWT tokens (per Next.js best practices for proxy performance).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token cookie
  const accessToken = request.cookies.get('erp_access_token')?.value;
  const isAuthenticated = !!accessToken;

  // Check if current path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}?`)
  );

  // If authenticated user visits login page, redirect to root
  // (client-side will handle role-based redirect)
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
