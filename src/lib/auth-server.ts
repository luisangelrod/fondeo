// src/lib/auth-server.ts
// Single server-side auth entry point.
//
// All server routes and pages import from here, never from @clerk/nextjs/server directly.
//
// Mock vs. real Clerk is handled at BUILD TIME via the webpack alias in next.config.ts:
//   - USE_AUTH_MOCKS=true  → alias redirects @clerk/nextjs/server to src/mocks/clerk-server.ts
//   - USE_AUTH_MOCKS=false → @clerk/nextjs/server resolves to the real Clerk package
//
// Production requirements (when USE_AUTH_MOCKS=false):
//   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  (set in Vercel env dashboard)
//   - CLERK_SECRET_KEY                   (set in Vercel env dashboard)
export { auth, currentUser } from '@clerk/nextjs/server';
