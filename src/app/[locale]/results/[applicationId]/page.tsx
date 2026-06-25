import { auth } from '@/lib/auth-server'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { businesses, aiQualifications, lenderMatches } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { LENDERS } from '@/lib/lenders'
import { getLendScoreLabel, getLendScoreColorClass } from '@/lib/utils'
import { CheckCircle, AlertCircle, TrendingUp, Shield } from 'lucide-react'
import { LenderCard } from './lender-card'

// Sort order: best approval odds first
const ODDS_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

interface Props {
  params: Promise<{ applicationId: string; locale: string }>
}


export default async function ResultsPage({ params }: Props) {
  const { applicationId, locale } = await params

  const t = await getTranslations({ locale, namespace: 'results' })

  const { userId } = await auth()
  if (!userId) notFound()

  let business: any, qualification: any, rawMatches: any[] = [];
  try {
    const [biz] = await db.select().from(businesses)
      .where(and(eq(businesses.id, applicationId), eq(businesses.clerkUserId, userId))).limit(1)
    if (!biz) notFound()
    business = biz
    const [qual] = await db.select().from(aiQualifications)
      .where(eq(aiQualifications.businessId, applicationId))
      .orderBy(desc(aiQualifications.createdAt))
      .limit(1)
    if (!qual) notFound()
    qualification = qual
    rawMatches = await db.select().from(lenderMatches)
      .where(eq(lenderMatches.businessId, applicationId))
  } catch (e: any) {
    if (e?.digest === 'NEXT_NOT_FOUND') throw e
    notFound()
  }

  // Best approval odds (high → medium → low) shown first
  const matches = [...rawMatches].sort(
    (a, b) => (ODDS_ORDER[a.approvalOdds] ?? 99) - (ODDS_ORDER[b.approvalOdds] ?? 99)
  )

  const score = qualification.lendScore as number
  const { labelEs, label } = getLendScoreLabel(score)
  const scoreColorClass = getLendScoreColorClass(score)
  const scoreLabel = locale === 'es' ? labelEs : label
  const barColor =
    score >= 70 ? 'bg-green-500' :
    score >= 50 ? 'bg-blue-500' :
    score >= 35 ? 'bg-yellow-500' : 'bg-orange-500'
  const strengths = (qualification.strengths as string[]) ?? []
  const redFlags = (qualification.redFlags as string[]) ?? []
  const strengthsLabel = t('strengths')
  const redFlagsLabel = t('redFlags')

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Fondeo</span>
          </div>
          {/* Big score number */}
          <div className={`text-8xl font-bold ${scoreColorClass} mb-1 leading-none`}>{score}</div>
          <div className="text-gray-400 text-sm mb-4">LendScore / 100</div>

          {/* Visual progress bar */}
          <div className="max-w-xs mx-auto mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{t('scoreLow')}</span>
              <span>{t('scoreGreat')}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Contextual score label */}
          <div className={`font-semibold text-base ${scoreColorClass} mb-4`}>{scoreLabel}</div>

          <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed">
            {qualification.summary as string}
          </p>

          {/* Anti-spam pill */}
          <div className="inline-flex items-center gap-1.5 mt-5 text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1.5">
            <Shield size={11} />
            {locale === 'es'
              ? 'Solo tú decides qué prestamista recibe tu información.'
              : 'Only you decide which lender receives your information.'}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {matches.map(match => (
            <LenderCard
              key={match.id}
              match={match}
              lender={LENDERS[match.lenderSlug as keyof typeof LENDERS]}
              locale={locale}
            />
          ))}
        </div>

        {matches.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-3 mb-8">
            <div className="text-2xl">⏳</div>
            <h3 className="font-semibold text-amber-900">
              {t('noMatchTitle')}
            </h3>
            <p className="text-amber-800 text-sm">
              {t('noMatchBody')}
            </p>
            <div className="text-left mt-4 space-y-2 text-sm text-amber-800">
              <p className="font-medium">
                {t('requirements')}:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('reqRevenue')}</li>
                <li>{t('reqTime')}</li>
                <li>{t('reqCredit')}</li>
              </ul>
            </div>
            <a href="/apply" className="inline-block mt-4 text-sm font-medium text-amber-900 underline">
              {t('reapplyLink')}
            </a>
          </div>
        )}

        {strengths.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-fondeo-green-600" /> {strengthsLabel}
            </h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-fondeo-green-600 mt-0.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {redFlags.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-500" /> {redFlagsLabel}
            </h3>
            <ul className="space-y-2">
              {redFlags.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertCircle size={14} className="text-yellow-500 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legal Disclosure */}
        <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
          {t('lenderDisclosure')}
        </p>
      </div>
    </main>
  )
}
