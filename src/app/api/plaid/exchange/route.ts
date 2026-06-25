import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { z } from 'zod';
import { exchangePlaidToken } from '@/lib/plaid-exchange';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody: unknown = await req.json();
    const bodySchema = z.object({
      public_token: z.string().min(1),
      business_id: z.string().uuid(),
    });
    const bodyParsed = bodySchema.safeParse(rawBody);
    if (!bodyParsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: bodyParsed.error.flatten() },
        { status: 400 }
      );
    }
    const { public_token, business_id } = bodyParsed.data;

    const result = await exchangePlaidToken(public_token, business_id, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Error al procesar la conexión bancaria' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      institutionName: result.institutionName,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error('Plaid exchange error:', error);
    return NextResponse.json({ error: 'Error al procesar la conexión bancaria' }, { status: 500 });
  }
}
