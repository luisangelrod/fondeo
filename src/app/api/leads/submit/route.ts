import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businesses, lenderMatches, leadSubmissions } from '@/db/schema';
import { LENDERS, type LenderSlug } from '@/lib/lenders';
import { Resend } from 'resend';

// Lazy Resend client — avoids a module-level throw during Next.js static
// analysis. Email sends are wrapped in non-fatal try/catch blocks below.
let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[leads/submit] RESEND_API_KEY is not set — email notifications will fail silently');
    }
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'not-configured');
  }
  return _resend;
}

/**
 * Escapes the five HTML special characters to prevent injection into the
 * email templates below. Business-supplied strings (name, email, phone) are
 * interpolated directly into innerHTML — without escaping, a business named
 * `<img src=x onerror=alert(1)>` would execute in the admin's email client.
 */
function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const submitSchema = z.object({
  lenderMatchId: z.string().uuid(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lenderMatchId } = parsed.data;

    // Fetch lender match and verify ownership
    const [match] = await db
      .select({ match: lenderMatches, business: businesses })
      .from(lenderMatches)
      .innerJoin(businesses, eq(lenderMatches.businessId, businesses.id))
      .where(
        and(
          eq(lenderMatches.id, lenderMatchId),
          eq(businesses.clerkUserId, userId)
        )
      );

    if (!match) {
      return NextResponse.json(
        { error: 'Lender match not found or not authorized' },
        { status: 404 }
      );
    }

    const lenderProfile = LENDERS[match.match.lenderSlug as LenderSlug];
    if (!lenderProfile) {
      console.error(`[leads/submit] Unknown lender slug: ${match.match.lenderSlug} — using fallback commission rate`);
    }
    const commissionRate = lenderProfile?.commissionRate ?? 0.03;

    // Duplicate guard: reject if there is already an active (non-declined) submission
    // for this business + lender combination
    const [existingSubmission] = await db
      .select({ id: leadSubmissions.id, status: leadSubmissions.status })
      .from(leadSubmissions)
      .where(
        and(
          eq(leadSubmissions.businessId, match.business.id),
          eq(leadSubmissions.lenderSlug, match.match.lenderSlug),
          ne(leadSubmissions.status, 'declined'),
        )
      )
      .limit(1);

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: 'Ya tienes una solicitud activa con este prestamista.',
          submissionId: existingSubmission.id,
          status: existingSubmission.status,
        },
        { status: 409 }
      );
    }

    // Estimate commission amount from the match's estimated amount (midpoint heuristic)
    // Real commission is calculated when fundedAmount is set via admin PATCH
    const estimatedMidpoint = (() => {
      const raw = match.match.estimatedAmount ?? '';
      const numbers = raw.replace(/[$,]/g, '').match(/\d+/g);
      if (!numbers || numbers.length === 0) return null;
      const vals = numbers.map(Number);
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    })();
    const estimatedCommission = estimatedMidpoint
      ? String((estimatedMidpoint * commissionRate).toFixed(2))
      : null;

    // Create lead submission
    const [submission] = await db
      .insert(leadSubmissions)
      .values({
        businessId: match.business.id,
        lenderMatchId: match.match.id,
        lenderSlug: match.match.lenderSlug,
        lenderName: match.match.lenderName,
        status: 'submitted',
        commissionRate: String(commissionRate),
        ...(estimatedCommission ? { commissionAmount: estimatedCommission } : {}),
      })
      .returning();

    if (!process.env.ADMIN_EMAIL) {
      console.warn('[leads/submit] ADMIN_EMAIL env var is not set — falling back to default address');
    }
    const adminEmail = process.env.ADMIN_EMAIL ?? 'luisangelrod17@gmail.com';

    // Send admin notification email (non-fatal)
    try {
      await getResend().emails.send({
        from: process.env.RESEND_FROM ?? 'Fondeo <noreply@fondeo.app>',
        to: [adminEmail],
        subject: `🚀 Nueva solicitud: ${escapeHtml(match.business.businessName)} → ${escapeHtml(match.match.lenderName)}`,
        html: `
          <h2>Nueva solicitud de préstamo</h2>
          <table>
            <tr><td><strong>Negocio:</strong></td><td>${escapeHtml(match.business.businessName)}</td></tr>
            <tr><td><strong>Dueño:</strong></td><td>${escapeHtml(match.business.ownerName)}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${escapeHtml(match.business.email)}</td></tr>
            <tr><td><strong>Teléfono:</strong></td><td>${escapeHtml(match.business.phone ?? 'N/A')}</td></tr>
            <tr><td><strong>Prestamista:</strong></td><td>${escapeHtml(match.match.lenderName)}</td></tr>
            <tr><td><strong>Monto estimado:</strong></td><td>${escapeHtml(match.match.estimatedAmount ?? 'N/A')}</td></tr>
            <tr><td><strong>Probabilidad:</strong></td><td>${escapeHtml(match.match.approvalOdds)}</td></tr>
            <tr><td><strong>Comisión:</strong></td><td>${(commissionRate * 100).toFixed(0)}%</td></tr>
            <tr><td><strong>Lead ID:</strong></td><td>${submission.id}</td></tr>
          </table>
          ${lenderProfile ? `<p><a href="${lenderProfile.isoPortalUrl}">Portal ISO de ${escapeHtml(lenderProfile.name)}</a></p>` : ''}
        `,
      });
    } catch (emailErr) {
      console.error('Admin email notification failed (non-fatal):', emailErr);
    }

    // Send borrower confirmation email (non-fatal)
    try {
      await getResend().emails.send({
        from: process.env.RESEND_FROM ?? 'Fondeo <noreply@fondeo.app>',
        to: [match.business.email],
        subject: `✅ Tu solicitud fue enviada a ${escapeHtml(match.match.lenderName)}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#16a34a">¡Solicitud enviada exitosamente!</h2>
            <p>Hola ${escapeHtml(match.business.ownerName)},</p>
            <p>Tu solicitud de financiamiento fue enviada a <strong>${escapeHtml(match.match.lenderName)}</strong>.
            Un representante se pondrá en contacto contigo en breve.</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Prestamista</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(match.match.lenderName)}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Monto estimado</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(match.match.estimatedAmount ?? 'Por determinar')}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Producto</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(match.match.bestProduct ?? 'Por determinar')}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>N.° de referencia</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${submission.id}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:13px">Fondeo no cobra ninguna comisión al solicitante. El servicio es completamente gratuito para ti.</p>
            <p style="color:#6b7280;font-size:13px">Si tienes preguntas, responde a este correo.</p>
          </div>
        `,
      });
    } catch (borrowerEmailErr) {
      console.error('Borrower confirmation email failed (non-fatal):', borrowerEmailErr);
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      lenderName: match.match.lenderName,
      isoPortalUrl: lenderProfile?.isoPortalUrl,
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json({ error: 'Error al enviar la solicitud' }, { status: 500 });
  }
}
