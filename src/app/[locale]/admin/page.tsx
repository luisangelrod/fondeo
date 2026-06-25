import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { desc, eq, sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db';
import {
  businesses,
  leadSubmissions,
  lenderMatches,
} from '@/db/schema';
import { NavBar } from '@/components/nav-bar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AdminTable } from './admin-table';
import { DollarSign, FileText, TrendingUp, Users } from 'lucide-react';

interface AdminPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });

  const sp = await (searchParams ?? Promise.resolve({}));
  const page = Number(sp?.page ?? 1);
  const PAGE_SIZE = 50;
  const offset = (page - 1) * PAGE_SIZE;

  // Guard: only admin can access this page
  if (userId !== process.env.ADMIN_USER_ID) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold text-lg">{t('unauthorized')}</p>
        </div>
      </div>
    );
  }

  // Fetch paginated lead submissions with business + lender info
  const rawLeads = await db
    .select({
      submissionId: leadSubmissions.id,
      status: leadSubmissions.status,
      submittedAt: leadSubmissions.submittedAt,
      commissionRate: leadSubmissions.commissionRate,
      commissionAmount: leadSubmissions.commissionAmount,
      businessId: businesses.id,
      businessName: businesses.businessName,
      ownerName: businesses.ownerName,
      email: businesses.email,
      lenderName: lenderMatches.lenderName,
      lenderSlug: lenderMatches.lenderSlug,
      estimatedAmount: lenderMatches.estimatedAmount,
      approvalOdds: lenderMatches.approvalOdds,
    })
    .from(leadSubmissions)
    .innerJoin(businesses, eq(leadSubmissions.businessId, businesses.id))
    .innerJoin(lenderMatches, eq(leadSubmissions.lenderMatchId, lenderMatches.id))
    .orderBy(desc(leadSubmissions.submittedAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const leads = rawLeads.map((r) => ({
    id: String(r.submissionId),
    businessName: r.businessName,
    ownerName: r.ownerName,
    email: r.email,
    lenderName: r.lenderName,
    lenderSlug: r.lenderSlug,
    estimatedAmount: r.estimatedAmount,
    approvalOdds: r.approvalOdds,
    status: r.status,
    submittedAt: r.submittedAt,
    commissionRate: r.commissionRate,
    commissionAmount: r.commissionAmount,
  }));

  // Total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leadSubmissions);
  const totalPages = Math.ceil(Number(count) / PAGE_SIZE);

  // Aggregate stats
  const totalLeads = leads.length;
  const fundedLeads = leads.filter((l) => l.status === 'funded');
  const pendingLeads = leads.filter(
    (l) => l.status === 'submitted' || l.status === 'pending'
  );
  const declinedLeads = leads.filter((l) => l.status === 'declined');

  const totalCommissionEarned = fundedLeads.reduce((sum, l) => {
    const amt = parseFloat(l.commissionAmount ?? '0');
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const pendingCommissionEst = pendingLeads.reduce((sum, l) => {
    // Rough estimate: commission rate * lower bound of estimated amount
    const rate = parseFloat(l.commissionRate ?? '0');
    const amtStr = l.estimatedAmount ?? '';
    const lower = parseInt(
      amtStr.replace(/[^0-9,\-–]/g, '').split(/[-–]/)[0]?.replace(/,/g, '') ?? '0',
      10
    );
    return sum + (isNaN(lower) ? 0 : lower * rate);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar locale={locale} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">Fondeo · Panel interno</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {t('submittedLeads')}
                </p>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-3xl font-black text-gray-900">{totalLeads}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {t('funded')}
                </p>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-black text-green-600">{fundedLeads.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {t('commissions')}
                </p>
                <DollarSign className="h-4 w-4 text-fondeo-green-600" />
              </div>
              <p className="text-3xl font-black text-fondeo-green-700">
                ${totalCommissionEarned.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              {pendingCommissionEst > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  + est. ${Math.round(pendingCommissionEst).toLocaleString()} {t('pendingLabel')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {t('pending')}
                </p>
                <Users className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-3xl font-black text-yellow-600">{pendingLeads.length}</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="mb-8" />

        {/* Leads table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('submittedLeads')}
              </h2>
              <div className="flex gap-2">
                <Badge variant="success">{fundedLeads.length} {t('funded')}</Badge>
                <Badge variant="warning">{pendingLeads.length} {t('pending')}</Badge>
                {declinedLeads.length > 0 && (
                  <Badge variant="default">{declinedLeads.length} {t('declined')}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <AdminTable leads={leads} />
        </Card>

        {/* Pagination */}
        <div className="flex gap-4 justify-center mt-8">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="text-primary underline">
              ← {t('previous')}
            </a>
          )}
          <span className="text-muted-foreground">
            {t('page')} {page} {t('of')} {totalPages}
          </span>
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="text-primary underline">
              {t('next')} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
