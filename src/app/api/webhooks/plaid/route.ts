import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { plaidConnections, businesses, aiQualifications, lenderMatches } from '@/db/schema';
import { qualifyBusiness, analyzePlaidTransactions } from '@/lib/qualify';
import { LENDERS, type LenderSlug } from '@/lib/lenders';
import { Configuration, PlaidApi, PlaidEnvironments, WebhookType } from 'plaid';

function getPlaidClient(): PlaidApi {
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
 * Verifies the Plaid-Verification JWT header against the raw request body.
 *
 * Plaid signs every webhook with an ES256 JWT. The payload contains
 * `request_body_sha256` — the SHA-256 hex digest of the raw body.
 * We verify the JWT signature using Plaid's rotating public key (fetched
 * via the SDK) and then compare the body hash. Tokens older than 5 min
 * are rejected as replay protection.
 *
 * See: https://plaid.com/docs/api/webhooks/webhook-verification/
 */
async function verifyPlaidWebhookSignature(
  rawBody: string,
  verificationToken: string
): Promise<boolean> {
  try {
    const parts = verificationToken.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

    // Decode the JWT header to get the key_id
    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString('utf-8')
    ) as { kid?: string; alg?: string };
    if (!header.kid) return false;

    // Fetch Plaid's rotating public key
    const plaidClient = getPlaidClient();
    const keyResp = await plaidClient.webhookVerificationKeyGet({ key_id: header.kid });
    const jwk = keyResp.data.key;

    // Reject if the key itself has expired
    if (typeof jwk.expired_at === 'number' && Date.now() / 1000 > jwk.expired_at) {
      return false;
    }

    // Cast the Plaid SDK's JWKPublicKey to JsonWebKey via unknown.
    // Plaid returns a proper EC P-256 JWK; the double cast is safe here
    // because JWKPublicKey lacks an index signature but is structurally
    // compatible with JsonWebKey.
    const jwkData = jwk as unknown as JsonWebKey;

    // Import the public key using the Web Crypto API (Node 18+ / Next.js 15)
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwkData,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    // Verify the JWT signature over "headerB64.payloadB64"
    const signingInput = `${headerB64}.${payloadB64}`;
    const sigBytes = Buffer.from(signatureB64, 'base64url');
    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      sigBytes,
      new TextEncoder().encode(signingInput)
    );
    if (!isValid) return false;

    // Decode the payload and check token age + body hash
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    ) as { request_body_sha256?: string; iat?: number };

    // Reject tokens older than 5 minutes (replay protection)
    if (typeof payload.iat === 'number' && Date.now() / 1000 - payload.iat > 300) {
      return false;
    }

    // Compare the claimed body hash against the actual raw body
    const bodyHash = createHash('sha256').update(rawBody).digest('hex');
    return payload.request_body_sha256 === bodyHash;
  } catch (err) {
    console.error('Plaid webhook signature verification error:', err);
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Read raw body first — req.text() must precede any other body read
  // because the Next.js body is a one-shot readable stream.
  const rawBody = await req.text();

  // Reject requests with no Plaid-Verification header immediately
  const verificationToken = req.headers.get('Plaid-Verification');
  if (!verificationToken) {
    console.warn('Plaid webhook received without Plaid-Verification header');
    return NextResponse.json({ error: 'Missing Plaid-Verification header' }, { status: 401 });
  }

  const isVerified = await verifyPlaidWebhookSignature(rawBody, verificationToken);
  if (!isVerified) {
    console.warn('Plaid webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as {
      webhook_type?: string;
      webhook_code?: string;
      item_id?: string;
    };

    const { webhook_type, webhook_code, item_id } = body;

    if (
      webhook_type !== WebhookType.Transactions ||
      (webhook_code !== 'TRANSACTIONS_REMOVED' && webhook_code !== 'DEFAULT_UPDATE')
    ) {
      return NextResponse.json({ received: true });
    }

    if (!item_id) {
      return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });
    }

    const [connection] = await db
      .select()
      .from(plaidConnections)
      .where(eq(plaidConnections.itemId, item_id));

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, connection.businessId));

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const plaidClient = getPlaidClient();
    const now = new Date();
    const endDate = now.toISOString().split('T')[0]!;
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]!;

    const txnResponse = await plaidClient.transactionsGet({
      access_token: connection.accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    const plaidAnalysis = analyzePlaidTransactions(
      txnResponse.data.transactions.map((t) => ({ amount: t.amount, date: t.date }))
    );

    const qualification = await qualifyBusiness({
      businessType: business.businessType,
      timeInBusiness: business.timeInBusiness,
      state: business.state,
      monthlyRevenue: business.monthlyRevenue,
      revenueConsistency: business.revenueConsistency ?? undefined,
      loanPurpose: business.loanPurpose,
      loanAmount: business.loanAmount,
      creditScoreRange: business.creditScoreRange ?? undefined,
      plaidData: plaidAnalysis,
    });

    // Wrap all three DB writes in a transaction.
    // Previously: if lenderMatches insert failed, the aiQualifications row
    // was left orphaned (no match rows → empty results UI with no recovery path).
    await db.transaction(async (tx) => {
      await tx
        .update(plaidConnections)
        .set({ lastSynced: new Date() })
        .where(eq(plaidConnections.id, connection.id));

      const [savedQual] = await tx
        .insert(aiQualifications)
        .values({
          businessId: business.id,
          lendScore: qualification.lendScore,
          summary: qualification.summary,
          eligibleProducts: qualification.eligibleProducts,
          lenderMatches: qualification.lenderMatches,
          redFlags: qualification.redFlags,
          strengths: qualification.strengths,
        })
        .returning();

      if (qualification.lenderMatches.length > 0) {
        await tx.insert(lenderMatches).values(
          qualification.lenderMatches.map((match) => ({
            businessId: business.id,
            qualificationId: savedQual.id,
            lenderName: LENDERS[match.lenderSlug as LenderSlug]?.name ?? match.lenderSlug,
            lenderSlug: match.lenderSlug,
            estimatedAmount: match.estimatedAmount,
            approvalOdds: match.approvalOdds,
            bestProduct: match.bestProduct,
            note: match.note,
            isVisible: true,
          }))
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Plaid webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
