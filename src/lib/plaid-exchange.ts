import { CountryCode } from 'plaid';
import { db } from '@/db';
import { plaidConnections } from '@/db/schema';
import { analyzePlaidTransactions, type PlaidSummary } from '@/lib/qualify';
import { getPlaidClient, fetchAllTransactions } from '@/lib/plaid';

/**
 * Core Plaid token exchange logic, extracted from /api/plaid/exchange so it
 * can be called directly from other server-side code without an HTTP round-trip.
 *
 * Exchanges a Link public_token for a permanent access_token, persists the
 * plaidConnection row, fetches all transactions (with full pagination), and
 * returns the analyzed summary.
 *
 * The _userId parameter is accepted for audit/logging use and future
 * row-level-security enforcement but is not required by the Plaid calls.
 */
export async function exchangePlaidToken(
  publicToken: string,
  businessId: string,
  _userId: string,
): Promise<{
  success: boolean;
  institutionName?: string;
  analysis?: PlaidSummary;
  error?: string;
}> {
  try {
    const plaidClient = getPlaidClient();

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
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
      // Non-fatal: institution name is informational only
    }

    await db.insert(plaidConnections).values({
      businessId,
      accessToken,
      itemId,
      institutionName,
      lastSynced: new Date(),
    });

    const now = new Date();
    const endDate = now.toISOString().split('T')[0]!;
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!;

    const { transactions } = await fetchAllTransactions(
      plaidClient,
      accessToken,
      startDate,
      endDate,
    );

    const analysis = analyzePlaidTransactions(
      transactions.map((t) => ({
        amount: t.amount,
        date: t.date,
        name: t.name ?? t.merchant_name ?? '',
        merchant_name: t.merchant_name ?? '',
        personal_finance_category: t.personal_finance_category ?? null,
      })),
    );

    return { success: true, institutionName, analysis };
  } catch (error) {
    console.error('[plaid-exchange] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in Plaid exchange',
    };
  }
}
