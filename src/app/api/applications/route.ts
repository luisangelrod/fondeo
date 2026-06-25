import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businesses, aiQualifications, lenderMatches } from '@/db/schema';
import { qualifyBusiness, type PlaidSummary } from '@/lib/qualify';
import { exchangePlaidToken } from '@/lib/plaid-exchange';
import { LENDERS, type LenderSlug } from '@/lib/lenders';

const applicationSchema = z.object({
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  timeInBusiness: z.string().min(1),
  state: z.string().min(1),
  monthlyRevenue: z.string().min(1),
  revenueConsistency: z.string().optional(),
  loanPurpose: z.string().min(1),
  loanAmount: z.string().min(1),
  urgency: z.string().optional(),
  ownerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  creditScoreRange: z.string().optional(),
  plaidPublicToken: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`applications:${userId}`, 5, 60 * 60 * 1000); // 5 per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body: unknown = await req.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Upsert business (unique per Clerk user)
    const [business] = await db
      .insert(businesses)
      .values({
        clerkUserId: userId,
        businessName: data.businessName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        businessType: data.businessType,
        state: data.state,
        monthlyRevenue: data.monthlyRevenue,
        revenueConsistency: data.revenueConsistency,
        timeInBusiness: data.timeInBusiness,
        creditScoreRange: data.creditScoreRange,
        loanPurpose: data.loanPurpose,
        loanAmount: data.loanAmount,
        urgency: data.urgency,
      })
      .onConflictDoUpdate({
        target: businesses.clerkUserId,
        set: {
          businessName: data.businessName,
          ownerName: data.ownerName,
          email: data.email,
          phone: data.phone,
          businessType: data.businessType,
          state: data.state,
          monthlyRevenue: data.monthlyRevenue,
          revenueConsistency: data.revenueConsistency,
          timeInBusiness: data.timeInBusiness,
          creditScoreRange: data.creditScoreRange,
          loanPurpose: data.loanPurpose,
          loanAmount: data.loanAmount,
          urgency: data.urgency,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Optionally exchange Plaid token — direct function call instead of an
    // HTTP round-trip back to /api/plaid/exchange (Fix 3: eliminates the
    // self-calling fetch anti-pattern and the INTERNAL_API_SECRET dependency).
    let plaidAnalysis: PlaidSummary | undefined = undefined;
    if (data.plaidPublicToken) {
      try {
        const result = await exchangePlaidToken(data.plaidPublicToken, business.id, userId);
        if (result.success) {
          plaidAnalysis = result.analysis;
          // Mark Plaid as connected on the business row
          await db.update(businesses)
            .set({ plaidConnected: true })
            .where(eq(businesses.id, business.id));
        }
      } catch (err) {
        console.error('Plaid exchange failed (non-fatal):', err);
      }
    }

    // Run Claude AI qualification (now includes Plaid data when available)
    const qualification = await qualifyBusiness({
      businessName: data.businessName,
      businessType: data.businessType,
      timeInBusiness: data.timeInBusiness,
      state: data.state,
      monthlyRevenue: data.monthlyRevenue,
      revenueConsistency: data.revenueConsistency,
      loanPurpose: data.loanPurpose,
      loanAmount: data.loanAmount,
      urgency: data.urgency,
      creditScoreRange: data.creditScoreRange,
      plaidData: plaidAnalysis,
    });

    // Wrap aiQualifications + lenderMatches in a single transaction.
    // Previously these were two separate awaits: if the lenderMatches insert
    // failed, the aiQualifications row was left orphaned (no match rows → UI
    // showed an empty results page with no way to recover).
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

    return NextResponse.json({ applicationId: business.id }, { status: 201 });
  } catch (error) {
    console.error('Application error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
