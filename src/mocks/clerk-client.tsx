/* eslint-disable */
// src/mocks/clerk-client.tsx
// Dev-only mock for @clerk/nextjs — allows UI testing without real Clerk credentials
'use client';

import React from 'react';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SignInButton({ children }: { children?: React.ReactNode }) {
  return <a href="/sign-in" className="text-sm font-medium">{children || 'Sign In'}</a>;
}

export function SignUpButton({ children }: { children?: React.ReactNode }) {
  return <a href="/sign-up" className="text-sm font-medium">{children || 'Sign Up'}</a>;
}

export function UserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
      T
    </div>
  );
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  return null;
}

// Mock SignIn and SignUp components — redirect to home in dev mode
export function SignIn({ appearance }: { appearance?: any }) {
  return (
    <div className="p-6 border border-gray-200 rounded-xl text-center bg-white shadow">
      <p className="text-gray-500 text-sm mb-2">Auth bypassed (dev mode)</p>
      <p className="text-gray-700 font-medium">Signed in as test@example.com</p>
      <a href="/" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">Go to app →</a>
    </div>
  );
}

export function SignUp({ appearance }: { appearance?: any }) {
  return (
    <div className="p-6 border border-gray-200 rounded-xl text-center bg-white shadow">
      <p className="text-gray-500 text-sm mb-2">Auth bypassed (dev mode)</p>
      <p className="text-gray-700 font-medium">Signed in as test@example.com</p>
      <a href="/" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">Go to app →</a>
    </div>
  );
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'dev_user_test123',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com', id: '1' }],
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      imageUrl: '',
      publicMetadata: {},
    }
  };
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: 'dev_user_test123',
    sessionId: 'dev_session_123',
    orgId: undefined,
    signOut: async () => {},
    getToken: async () => 'dev_token_123',
  };
}

export function useClerk() {
  return {
    signOut: async () => {},
    openSignIn: () => {},
    openSignUp: () => {},
  };
}

export function useOrganization() {
  return { organization: null, isLoaded: true };
}

export const auth = async () => ({ userId: 'dev_user_test123', sessionId: 'dev_session_123' });
export const currentUser = async () => ({
  id: 'dev_user_test123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com', id: '1' }],
  primaryEmailAddress: { emailAddress: 'test@example.com' },
});
