import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Routes that should bypass the intl middleware entirely
const INTL_SKIP_PREFIXES = ['/sign-in', '/sign-up', '/api/'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev bypass: skip auth entirely when DISABLE_AUTH=true
  // Clerk imports are also aliased to mocks via webpack (next.config.ts)
  if (process.env.DISABLE_AUTH === 'true') {
    if (INTL_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    return intlMiddleware(request);
  }

  // Production: dynamically import Clerk so it never initialises when bypassed
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  const isProtectedRoute = createRouteMatcher([
    '/:locale/dashboard(.*)',
    '/:locale/admin(.*)',
    '/:locale/apply(.*)',
    '/:locale/results(.*)',
    '/dashboard(.*)',
    '/admin(.*)',
    // Non-locale-prefixed fallbacks so deep-links before intl redirect still auth-gate
    '/apply(.*)',
    '/results(.*)',
  ]);

  return clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }

    // Do not run the intl middleware for Clerk auth pages or API routes
    if (INTL_SKIP_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      return;
    }

    return intlMiddleware(req);
  })(request, {} as any);
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
