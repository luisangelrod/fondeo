// src/lib/auth-server.ts
// Single server-side auth entry point.
//
// CURRENT MODE: dev mock — always returns a fixed test user.
// All server routes and pages import from here, never from @clerk/nextjs/server directly.
//
// TO SWITCH TO REAL CLERK (production):
//   1. Set USE_AUTH_MOCKS=false in your env
//   2. Replace the two lines below with:
//      export { auth, currentUser } from '@clerk/nextjs/server';
//   3. Add real NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to env
//   4. Restore src/middleware.ts production branch to use @clerk/nextjs/server
export { auth, currentUser } from '../mocks/clerk-server';
