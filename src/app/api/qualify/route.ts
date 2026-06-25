import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businesses, aiQualifications, lenderMatches, plaidConnections } from '@/db/schema';
import { qualifyBusiness, analyzePlaidTransactions, type PlaidSummary } from '@/lib/qualify';
import { LENDERS, type LenderSlug } from '@/lib/lenders';
import { getPlaidClient, fetchAllTransactions } from '@/lib/plaid';

const bodySchema = z.object({
  businessId: z.string().uuid(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`qualify:${userId}`, 10, 60 * 60 * 1000); // 10 per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    // Validate + type-narrow the request body safely (replaces the previous
    // `await req.json() as { businessId?: string }` unsafe cast)
    const bodyParsed = bodySchema.safeParse(await req.json());
    if (!bodyParsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid businessId' },
        { status: 400 }
      );
    }
    const { businessId } = bodyParsed.data;

    const [business] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.clerkUserId, userId)));

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let plaidAnalysis: PlaidSummary | undefined = undefined;
    const [plaidConn] = await db
      .select()
      .from(plaidConnections)
      .where(eq(plaidConnections.businessId, businessId))
      .limit(1);

    if (plaidConn) {
      try {
        const plaidClient = getPlaidClient();

        const now = new Date();
        const endDate = now.toISOString().split('T')[0]!;
        const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]!;

        const { transactions } = await fetchAllTransactions(
          plaidClient,
          plaidConn.accessToken,
          startDate,
          endDate,
        );

        plaidAnalysis = analyzePlaidTransactions(
          transactions.map((t) => ({
            amount: t.amount,
            date: t.date,
            name: t.name ?? t.merchant_name ?? '',
            merchant_name: t.merchant_name ?? '',
            personal_finance_category: t.personal_finance_category ?? null,
          }))
        );
      } catch (plaidErr) {
        // Non-fatal: qualification proceeds without Plaid enrichment
        console.error('Failed to fetch Plaid transactions for qualification (non-fatal):', plaidErr);
      }
    }

    const qualification = await qualifyBusiness({
      businessName: business.businessName,
      businessType: business.businessType,
      timeInBusiness: business.timeInBusiness,
      state: business.state,
      monthlyRevenue: business.monthlyRevenue,
      revenueConsistency: business.revenueConsistency ?? undefined,
      loanPurpose: business.loanPurpose,
      loanAmount: business.loanAmount,
      urgency: business.urgency ?? undefined,
      creditScoreRange: business.creditScoreRange ?? undefined,
      plaidData: plaidAnalysis,
    });

    // Wrap both inserts in a transaction so a lenderMatches insert failure
    // doesn't leave an orphaned aiQualifications row with no match records.
    await db.transaction(async (tx) => {
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
            lenderSlug: match.lenderSlug,
            lenderName: LENDERS[match.lenderSlug as LenderSlug]?.name ?? match.lenderSlug,
            approvalOdds: match.approvalOdds,
            estimatedAmount: match.estimatedAmount,
            bestProduct: match.bestProduct,
            note: match.note,
            isVisible: true,
          }))
        );
      }
    });

    return NextResponse.json({ qualification });
  } catch (error) {
    console.error('Qualify error:', error);
    return NextResponse.json({ error: 'Error al ejecutar la calificación' }, { status: 500 });
  }
}
