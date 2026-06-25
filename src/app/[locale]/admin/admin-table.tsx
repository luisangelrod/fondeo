'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface Lead {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  lenderName: string;
  lenderSlug: string;
  estimatedAmount: string | null;
  approvalOdds: string;
  status: string;
  submittedAt: Date;
  commissionRate: string | null;
  commissionAmount: string | null;
}

interface AdminTableProps {
  leads: Lead[];
}

export function AdminTable({ leads: initialLeads }: AdminTableProps) {
  const t = useTranslations('admin');
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateStatus = async (leadId: string, status: 'funded' | 'declined') => {
    setLoadingId(leadId);
    try {
      const lead = leads.find((l) => l.id === leadId);
      // Estimate commission amount = 10% of lower bound of estimated amount
      let commissionAmount: string | undefined;
      if (status === 'funded' && lead?.estimatedAmount) {
        // Try to parse the lower bound, e.g. "$25,000 - $75,000" → 25000
        const match = lead.estimatedAmount.replace(/[^0-9,\-–]/g, '').split(/[-–]/)[0];
        const lower = parseInt(match?.replace(/,/g, '') ?? '0', 10);
        const rate = parseFloat(lead.commissionRate ?? '0.1');
        if (lower > 0 && rate > 0) {
          commissionAmount = (lower * rate).toFixed(2);
        }
      }

      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status, commissionAmount }),
      });

      if (!res.ok) throw new Error('Update failed');

      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                status,
                commissionAmount: commissionAmount ?? l.commissionAmount,
              }
            : l
        )
      );
    } catch (err) {
      console.error(err);
      alert(t('updateError'));
    } finally {
      setLoadingId(null);
    }
  };

  const statusVariant = (
    status: string
  ): 'success' | 'warning' | 'info' | 'default' => {
    if (status === 'funded') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'submitted') return 'info';
    return 'default';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      submitted: t('status.submitted'),
      funded: t('status.funded'),
      declined: t('status.declined'),
      pending: t('status.pending'),
    };
    return map[status] ?? status;
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">{t('noLeads')}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.business')}</th>
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.owner')}</th>
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.lender')}</th>
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.submittedDate')}</th>
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.status')}</th>
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.commissionRate')}</th>
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.commissionAmount')}</th>
            <th className="py-3 px-4 text-gray-500 font-medium">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const isLoading = loadingId === lead.id;
            return (
              <tr key={lead.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{lead.businessName}</p>
                  <p className="text-xs text-gray-400">{lead.email}</p>
                </td>
                <td className="py-3 px-4 text-gray-700">{lead.ownerName}</td>
                <td className="py-3 px-4">
                  <p className="text-gray-900 font-medium">{lead.lenderName}</p>
                  <p className="text-xs text-gray-400">{lead.estimatedAmount ?? '—'}</p>
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                  {new Date(lead.submittedAt).toLocaleDateString('es-PR', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={statusVariant(lead.status)}>
                    {statusLabel(lead.status)}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {lead.commissionRate
                    ? `${(parseFloat(lead.commissionRate) * 100).toFixed(0)}%`
                    : '—'}
                </td>
                <td className="py-3 px-4 text-gray-700 font-medium">
                  {lead.commissionAmount
                    ? `$${parseFloat(lead.commissionAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td className="py-3 px-4">
                  {lead.status === 'submitted' || lead.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(lead.id, 'funded')}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('markFunded')}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(lead.id, 'declined')}
                        disabled={isLoading}
                        className="text-xs h-8 px-3 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('markDeclined')}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
