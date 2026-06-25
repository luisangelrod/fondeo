import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db';
import {
  businesses,
  aiQualifications,
  lenderMatches,
  leadSubmissions,
} from '@/db/schema';
import { NavBar } from '@/components/nav-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getLendScoreLabel, getLendScoreHex } from '@/lib/utils';
import {
  TrendingUp,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Link } from '@/navigation';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  // Fetch the most recent business for this user — gracefully handles missing DB
  let business: any = undefined;
  let qualification: any = null;
  let leads: any[] = [];

  try {
    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.clerkUserId, userId))
      .orderBy(desc(businesses.createdAt))
      .limit(1);
    business = biz;

    if (business) {
      qualification = await db
        .select()
        .from(aiQualifications)
        .where(eq(aiQualifications.businessId, business.id))
        .orderBy(desc(aiQualifications.createdAt))
        .limit(1)
        .then((r: any[]) => r[0] ?? null);

      leads = await db
        .select({
          submission: leadSubmissions,
          match: lenderMatches,
        })
        .from(leadSubmissions)
        .innerJoin(
          lenderMatches,
          eq(leadSubmissions.lenderMatchId, lenderMatches.id)
        )
        .where(eq(leadSubmissions.businessId, business.id))
        .orderBy(desc(leadSubmissions.submittedAt));
    }
  } catch {
    // DB unavailable (dev/placeholder) — show empty state
    business = undefined;
    qualification = null;
    leads = [];
  }

  const score = qualification?.lendScore ?? null;
  const scoreColor = score !== null ? getLendScoreHex(score) : '#9ca3af';
  const scoreMeta = score !== null ? getLendScoreLabel(score) : null;
  const scoreLabel = scoreMeta
    ? (locale === 'es'
        ? (scoreMeta.labelEs.split(' — ')[0] ?? scoreMeta.labelEs)
        : scoreMeta.label)
    : null;

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'info' | 'default'; label: string }> = {
      submitted: { variant: 'info', label: t('status.submitted') },
      funded: { variant: 'success', label: t('status.funded') },
      declined: { variant: 'default', label: t('status.declined') },
      pending: { variant: 'warning', label: t('status.pending') },
    };
    return map[status] ?? { variant: 'default' as const, label: status };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar locale={locale} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          {business && (
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {business.businessName}
            </p>
          )}
        </div>

        {/* No application yet */}
        {!business && (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="pt-12 pb-12 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">{t('noApplication')}</p>
              <Link href="/apply">
                <Button className="bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white">
                  {t('startApplication')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {business && (
          <div className="space-y-6">
            {/* Top stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* LendScore card */}
              <Card>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500 font-medium">{t('lendScore')}</p>
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                  {score !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-4xl font-black"
                        style={{ color: scoreColor }}
                      >
                        {score}
                      </span>
                      <span className="text-gray-400 text-sm">/ 100</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      {locale === 'es' ? 'Pendiente' : 'Pending'}
                    </span>
                  )}
                  {scoreLabel && (
                    <p className={`text-sm font-medium mt-1 ${scoreMeta?.color ?? 'text-gray-600'}`}>
                      {scoreLabel}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Application status */}
              <Card>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500 font-medium">
                      {t('applicationStatus')}
                    </p>
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {locale === 'es' ? 'Completada' : 'Completed'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(business.createdAt).toLocaleDateString(
                      locale === 'es' ? 'es-PR' : 'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Leads submitted */}
              <Card>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500 font-medium">
                      {t('submittedLeads')}
                    </p>
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-4xl font-black text-gray-900">{leads.length}</p>
                  {leads.some((l) => l.submission.status === 'funded') && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {locale === 'es' ? '¡Uno financiado!' : 'One funded!'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/results/${business.id}`}>
                <Button className="bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white">
                  {t('viewResults')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/apply">
                <Button variant="outline">{t('updateProfile')}</Button>
              </Link>
            </div>

            <Separator />

            {/* Submitted leads table */}
            {leads.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('submittedLeads')}
                </h2>
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            {t('table.lender')}
                          </th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            {t('table.submittedDate')}
                          </th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            {t('table.status')}
                          </th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            {t('table.amount')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map(({ submission, match }: any) => {
                          const { variant, label } = statusBadge(submission.status);
                          return (
                            <tr
                              key={submission.id}
                              className="border-b border-gray-50 last:border-0"
                            >
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {match.lenderName}
                              </td>
                              <td className="py-3 px-4 text-gray-500">
                                {new Date(submission.submittedAt).toLocaleDateString(
                                  locale === 'es' ? 'es-PR' : 'en-US',
                                  { month: 'short', day: 'numeric', year: 'numeric' }
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={variant}>{label}</Badge>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {match.estimatedAmount ?? '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
