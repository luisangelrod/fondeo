/* eslint-disable */
// src/mocks/clerk-server.ts
// Dev-only mock for @clerk/nextjs/server

export async function auth() {
  return {
    userId: 'dev_user_test123',
    sessionId: 'dev_session_123',
    orgId: undefined as string | undefined,
  };
}

export async function currentUser() {
  return {
    id: 'dev_user_test123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com', id: '1' }],
    primaryEmailAddress: { emailAddress: 'test@example.com' },
    imageUrl: '',
    publicMetadata: {} as Record<string, unknown>,
  };
}

export function clerkMiddleware(handler?: any) {
  return async (req: any, event?: any) => {
    const mockAuth = {
      protect: async () => {},
      userId: 'dev_user_test123',
      sessionId: 'dev_session_123',
      orgId: undefined as string | undefined,
    };
    if (handler) return handler(mockAuth, req);
    const { NextResponse } = await import('next/server');
    return NextResponse.next();
  };
}

export function createRouteMatcher(patterns: string[]) {
  return (req: any) => {
    const url = req.nextUrl?.pathname || req.url || '';
    return patterns.some(p => {
      const regex = new RegExp(p.replace(/\*/g, '.*').replace(/\//g, '\\/'));
      return regex.test(url);
    });
  };
}

// Re-export as getAuth for compatibility
export const getAuth = auth;
