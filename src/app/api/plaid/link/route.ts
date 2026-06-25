import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { Products, CountryCode } from 'plaid';
import { getPlaidClient } from '@/lib/plaid';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`plaid:${userId}`, 10, 60 * 60 * 1000); // 10 per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const plaidClient = getPlaidClient();

    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Fondeo',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'es',
    });

    return NextResponse.json({
      link_token: linkTokenResponse.data.link_token,
    });
  } catch (error) {
    console.error('Plaid link token error:', error);
    return NextResponse.json(
      { error: 'Error al crear el token de Plaid' },
      { status: 500 }
    );
  }
}
