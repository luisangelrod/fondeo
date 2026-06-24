'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Zap,
  DollarSign,
  Clock,
} from 'lucide-react';
import type { LenderMatch } from '@/db/schema';
import type { LenderProfile } from '@/lib/lenders';
import {
  getApprovalOddsLabel,
  getApprovalOddsBadgeVariant,
} from '@/lib/utils';

interface LenderCardProps {
  match: LenderMatch;
  lender: LenderProfile | undefined;
  locale: string;
}

export function LenderCard({ match, lender, locale }: LenderCardProps) {
  const t = useTranslations('results');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lenderMatchId: match.id }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Error al enviar la solicitud');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const badgeVariant = getApprovalOddsBadgeVariant(match.approvalOdds);
  const oddsLabel = getApprovalOddsLabel(match.approvalOdds, locale);

  return (
    <Card className="relative overflow-hidden border-gray-200 hover:border-fondeo-green-300 transition-colors">
      {/* Top accent */}
      <div
        className={`h-1 w-full ${
          match.approvalOdds === 'high'
            ? 'bg-green-500'
            : match.approvalOdds === 'medium'
            ? 'bg-yellow-500'
            : 'bg-blue-400'
        }`}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{match.lenderName}</h3>
            {lender && (
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                {locale === 'es' ? lender.descriptionEs : lender.descriptionEn}
              </p>
            )}
          </div>
          <Badge variant={badgeVariant} className="flex-shrink-0 text-xs">
            {oddsLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lender stats row */}
        <div className="grid grid-cols-2 gap-3">
          {match.estimatedAmount && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <DollarSign className="h-3 w-3" />
                {locale === 'es' ? 'Monto estimado' : 'Est. Amount'}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{match.estimatedAmount}</p>
            </div>
          )}
          {lender?.fundingSpeed && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <Clock className="h-3 w-3" />
                {t('fundingSpeed')}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{lender.fundingSpeed}</p>
            </div>
          )}
        </div>

        {/* Products */}
        {lender?.products && (
          <div>
            <p className="text-xs text-gray-500 mb-2">{t('products')}</p>
            <div className="flex flex-wrap gap-1.5">
              {lender.products.map((product: string) => (
                <span
                  key={product}
                  className="text-xs bg-fondeo-green-50 text-fondeo-green-800 px-2 py-0.5 rounded-full font-medium"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* CTA */}
        {submitted ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">{t('applied')}</p>
              <p className="text-green-700 text-xs mt-0.5">
                {locale === 'es'
                  ? 'Recibirás confirmación por correo electrónico en breve.'
                  : 'You will receive email confirmation shortly.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={handleApply}
              disabled={loading}
              className="w-full bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === 'es' ? 'Enviando...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {t('applyWith')} {match.lenderName}
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">{t('applyNote')}</p>
          </div>
        )}

        {/* ISO portal link (visible once submitted or for info) */}
        {lender?.isoPortalUrl && submitted && (
          <a
            href={lender.isoPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-fondeo-green-700 hover:underline"
          >
            {locale === 'es' ? 'Portal ISO de' : 'ISO Portal for'} {lender.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
