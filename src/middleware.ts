import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const INTL_SKIP_PREFIXES = ['/sign-in', '/sign-up', '/api/'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── DEV BYPASS ────────────────────────────────────────────────────────────
  // When USE_AUTH_MOCKS=true (or legacy DISABLE_AUTH=true) the app runs with
  // a hardcoded test user — no real Clerk keys required.
  //
  // Dev session gate: visitors must still provide the owner's credentials once.
  // The /dev-login page and /api/dev-auth/* routes are always public.
  // All other routes require the fondeo_dev_session cookie (set on login).
  //
  // TO SWITCH TO REAL CLERK: set USE_AUTH_MOCKS=false and uncomment the
  // production block at the bottom of this file. Then replace the import in
  // src/lib/auth-server.ts with the real @clerk/nextjs/server export.
  if (
    process.env.USE_AUTH_MOCKS === 'true' ||
    process.env.DISABLE_AUTH === 'true'
  ) {
    // Always allow the login flow through
    if (pathname === '/dev-login' || pathname.startsWith('/api/dev-auth')) {
      return NextResponse.next();
    }

    // Check for a valid dev session cookie
    const sessionCookie = request.cookies.get('fondeo_dev_session')?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/dev-login', request.url));
    }

    // Verify the cookie signature using Web Crypto (Edge-compatible, no extra deps)
    try {
      const secret = process.env.DEV_SESSION_SECRET ?? 'dev-fallback-secret';
      const [payloadB64, sigB64] = sessionCookie.split('.');
      if (!payloadB64 || !sigB64) throw new Error('malformed');

      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        Buffer.from(sigB64, 'base64'),
        new TextEncoder().encode(payloadB64)
      );
      if (!valid) throw new Error('invalid signature');

      // Check expiry
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
      if (Date.now() > payload.exp) throw new Error('expired');
    } catch {
      const res = NextResponse.redirect(new URL('/dev-login', request.url));
      res.cookies.delete('fondeo_dev_session');
      return res;
    }

    // Cookie valid — continue to app
    if (INTL_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    return intlMiddleware(request);
  }

  // ─── PRODUCTION (real Clerk) ────────────────────────────────────────────────
  // Uncomment when USE_AUTH_MOCKS=false and real Clerk keys are configured:
  //
  // const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  // const isProtectedRoute = createRouteMatcher([
  //   '/:locale/dashboard(.*)', '/:locale/admin(.*)',
  //   '/:locale/apply(.*)',     '/:locale/results(.*)',
  // ]);
  // return clerkMiddleware(async (auth, req) => {
  //   if (isProtectedRoute(req)) await auth.protect();
  //   if (INTL_SKIP_PREFIXES.some(p => req.nextUrl.pathname.startsWith(p))) return;
  //   return intlMiddleware(req);
  // })(request, {} as any);

  // Fallback until real Clerk is configured
  if (INTL_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
