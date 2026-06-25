// src/lib/auth-server.ts
// Single import point for all server-side auth.
// Set USE_AUTH_MOCKS=true in env to bypass Clerk (dev deployments with no real keys).
// In production leave USE_AUTH_MOCKS unset — real Clerk is used automatically.

export { auth, currentUser } from '@clerk/nextjs/server';
