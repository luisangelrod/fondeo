import {
  PlaidApi,
  TransactionsGetRequest,
  Configuration,
  PlaidEnvironments,
  Transaction,
} from 'plaid';

/**
 * Shared Plaid client factory.
 * Throws early if required env vars are missing — avoids opaque 400/401 errors
 * from Plaid when empty strings are sent as credentials.
 */
export function getPlaidClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId) throw new Error('PLAID_CLIENT_ID environment variable is not set');
  if (!secret) throw new Error('PLAID_SECRET environment variable is not set');

  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    })
  );
}

/**
 * Fetch ALL transactions from Plaid with automatic pagination.
 *
 * Plaid caps a single transactionsGet response at 500 items. Without
 * pagination, any business with >500 transactions in the lookback window
 * is silently truncated — producing a lower avgMonthlyDeposits and a worse
 * LendScore. This function loops until `total_transactions` is reached.
 */
export async function fetchAllTransactions(
  plaidClient: PlaidApi,
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<{ transactions: Transaction[]; total_transactions: number }> {
  const allTransactions: Transaction[] = [];
  let offset = 0;
  let totalTransactions = Infinity;

  while (allTransactions.length < totalTransactions) {
    const request: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 500,
        offset,
      },
    };

    const response = await plaidClient.transactionsGet(request);
    const { transactions, total_transactions } = response.data;

    totalTransactions = total_transactions;
    allTransactions.push(...transactions);
    offset += transactions.length;

    // Safety: stop on empty page to prevent an infinite loop
    if (transactions.length === 0) break;
  }

  return { transactions: allTransactions, total_transactions: totalTransactions };
}
