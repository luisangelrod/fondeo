import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Routes that should bypass the intl middleware entirely
const INTL_SKIP_PREFIXES = ['/sign-in', '/sign-up', '/api/'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev bypass: skip Clerk entirely when USE_AUTH_MOCKS=true (or legacy DISABLE_AUTH=true).
  // The webpack alias in next.config.ts already maps @clerk/nextjs/server → mocks,
  // but middleware runs on the Edge runtime which uses a separate bundle — so we
  // guard it here explicitly to avoid any Clerk initialisation overhead.
  if (
    process.env.USE_AUTH_MOCKS === 'true' ||
    process.env.DISABLE_AUTH === 'true'
  ) {
    if (INTL_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    return intlMiddleware(request);
  }

  // Production: use real Clerk middleware.
  // Dynamic import keeps Clerk out of the Edge bundle when the bypass is active.
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  const isProtectedRoute = createRouteMatcher([
    '/:locale/dashboard(.*)',
    '/:locale/admin(.*)',
    '/:locale/apply(.*)',
    '/:locale/results(.*)',
    '/dashboard(.*)',
    '/admin(.*)',
    '/apply(.*)',
    '/results(.*)',
  ]);

  return clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }

    if (INTL_SKIP_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      return;
    }

    return intlMiddleware(req);
  })(request, {} as any);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
