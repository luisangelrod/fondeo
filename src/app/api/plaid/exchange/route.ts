import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode } from 'plaid';
import { db } from '@/db';
import { plaidConnections } from '@/db/schema';
import { analyzePlaidTransactions } from '@/lib/qualify';

function getPlaidClient() {
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
          'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
        },
      },
    })
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const internalUserId = req.headers.get('x-internal-user-id');
    const userId = clerkUserId ?? internalUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { public_token?: string; business_id?: string };
    const { public_token, business_id } = body;

    if (!public_token) {
      return NextResponse.json({ error: 'Missing public_token' }, { status: 400 });
    }

    const plaidClient = getPlaidClient();

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    let institutionName = 'Unknown Bank';
    try {
      const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
      const institutionId = itemResponse.data.item.institution_id;
      if (institutionId) {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = instResponse.data.institution.name;
      }
    } catch {
      // Non-fatal
    }

    // business_id is a UUID string
    if (business_id) {
      await db.insert(plaidConnections).values({
        businessId: business_id,
        accessToken,
        itemId,
        institutionName,
        lastSynced: new Date(),
      });
    }

    const now = new Date();
    const endDate = now.toISOString().split('T')[0]!;
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!;

    const txnResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    const analysis = analyzePlaidTransactions(
      txnResponse.data.transactions.map((t) => ({ amount: t.amount, date: t.date }))
    );

    return NextResponse.json({ success: true, institutionName, analysis });
  } catch (error) {
    console.error('Plaid exchange error:', error);
    return NextResponse.json({ error: 'Error al procesar la conexión bancaria' }, { status: 500 });
  }
}
