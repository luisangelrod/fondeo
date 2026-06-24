import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/:locale/admin(.*)',
  '/:locale/apply(.*)',
  '/:locale/results(.*)',
  '/dashboard(.*)',
  '/admin(.*)',
]);

// Routes that should bypass the intl middleware entirely
const INTL_SKIP_PREFIXES = ['/sign-in', '/sign-up', '/api/'];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Do not run the intl middleware for Clerk auth pages or API routes
  if (INTL_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
