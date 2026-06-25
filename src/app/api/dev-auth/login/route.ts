import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const adminEmail = process.env.DEV_ADMIN_EMAIL;
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;
  const sessionSecret = process.env.DEV_SESSION_SECRET ?? 'dev-fallback-secret';

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Build a signed session token using HMAC-SHA256 (Web Crypto API — no extra deps)
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sessionSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const token = `${payload}.${Buffer.from(sig).toString('base64')}`;

  const response = NextResponse.json({ success: true });
  response.cookies.set('fondeo_dev_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return response;
}
