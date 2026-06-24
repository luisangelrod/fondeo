import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

function getPlaidClient() {
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  const config = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
        'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
      },
    },
  });
  return new PlaidApi(config);
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
