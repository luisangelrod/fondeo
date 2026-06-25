import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { leadSubmissions } from '@/db/schema';

const updateSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['submitted', 'funded', 'declined', 'pending']),
  commissionAmount: z.string().optional(),
  fundedAmount: z.string().optional(),
  commissionPaidAmount: z.string().optional(),
});

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId || userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { leadId, status, commissionAmount, fundedAmount, commissionPaidAmount } = parsed.data;

    await db
      .update(leadSubmissions)
      .set({
        status,
        ...(commissionAmount ? { commissionAmount } : {}),
        ...(status === 'funded'
          ? {
              confirmedAt: new Date(),
              confirmationMethod: 'manual',
              ...(fundedAmount ? { fundedAmount } : {}),
              // If actual funded amount provided, recalculate commission
              // (commissionAmount from body takes precedence if also supplied)
            }
          : {}),
        ...(commissionPaidAmount
          ? { commissionPaidAmount, commissionPaidAt: new Date() }
          : {}),
      })
      .where(eq(leadSubmissions.id, leadId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin lead update error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el lead' },
      { status: 500 }
    );
  }
}
