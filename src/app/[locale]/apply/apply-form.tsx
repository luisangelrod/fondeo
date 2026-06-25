'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  DollarSign,
  FileText,
  User,
  Landmark,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const US_STATES = [
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington, D.C.' }, { value: 'VI', label: 'U.S. Virgin Islands' },
  { value: 'GU', label: 'Guam' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Step1Data {
  businessName: string;
  businessType: string;
  timeInBusiness: string;
  state: string;
}

interface Step2Data {
  monthlyRevenue: string;
  revenueConsistency: string;
}

interface Step3Data {
  loanPurpose: string;
  loanAmount: string;
  urgency: string;
}

interface Step4Data {
  ownerName: string;
  email: string;
  phone: string;
  creditScoreRange: string;
}

// ── Full Form Data Type ───────────────────────────────────────────────────────

interface AllFormData {
  businessName: string;
  businessType: string;
  timeInBusiness: string;
  state: string;
  monthlyRevenue: string;
  revenueConsistency: string;
  loanPurpose: string;
  loanAmount: string;
  urgency: string;
  ownerName: string;
  email: string;
  phone: string;
  creditScoreRange: string;
  plaidPublicToken?: string;
  bankConnected?: boolean;
}

// ── Step Indicator Component ─────────────────────────────────────────────────

function StepIndicator({ step, icon: Icon, label }: { step: number; icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-fondeo-green-100 text-fondeo-green-700">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight hidden sm:block">{label}</span>
    </div>
  );
}

// ── Form Field Error ─────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" aria-live="polite" className="text-red-500 text-xs mt-1">{message}</p>;
}

// ── Step 1: Business Basics ──────────────────────────────────────────────────

function Step1({ defaultValues, onNext }: { defaultValues: Partial<AllFormData>; onNext: (d: Step1Data) => void }) {
  const t = useTranslations('apply');
  const tV = useTranslations('validation');
  const step1Schema = useMemo(() => z.object({
    businessName: z.string().min(1, tV('required')),
    businessType: z.string().min(1, tV('selectRequired')),
    timeInBusiness: z.string().min(1, tV('selectRequired')),
    state: z.string().min(1, tV('selectRequired')),
  }), [tV]);
  const { register, handleSubmit, control, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: defaultValues.businessName ?? '',
      businessType: defaultValues.businessType ?? '',
      timeInBusiness: defaultValues.timeInBusiness ?? '',
      state: defaultValues.state ?? '',
    },
  });

  const businessTypes = [
    { value: 'Retail', label: t('step1.businessTypes.Retail') },
    { value: 'Restaurant', label: t('step1.businessTypes.Restaurant') },
    { value: 'Service', label: t('step1.businessTypes.Service') },
    { value: 'Construction', label: t('step1.businessTypes.Construction') },
    { value: 'Transportation', label: t('step1.businessTypes.Transportation') },
    { value: 'Professional', label: t('step1.businessTypes.Professional') },
    { value: 'Other', label: t('step1.businessTypes.Other') },
  ];

  const timePeriods = [
    { value: 'Under 6 months', label: t('step1.timePeriods.Under 6 months') },
    { value: '3-6 months', label: t('step1.timePeriods.3-6 months') },
    { value: '6-12 months', label: t('step1.timePeriods.6-12 months') },
    { value: '1-2 years', label: t('step1.timePeriods.1-2 years') },
    { value: '2-5 years', label: t('step1.timePeriods.2-5 years') },
    { value: '5+ years', label: t('step1.timePeriods.5+ years') },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <Label htmlFor="businessName" className="dark:text-gray-200">{t('step1.businessName')} *</Label>
        <Input
          id="businessName"
          placeholder={t('step1.businessNamePlaceholder')}
          className={`mt-1 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.businessName ? 'border-red-500' : ''}`}
          {...register('businessName')}
        />
        <FieldError message={errors.businessName?.message} />
      </div>

      <div>
        <Label htmlFor="businessType" className="dark:text-gray-200">{t('step1.businessType')} *</Label>
        <Controller
          control={control}
          name="businessType"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="businessType" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.businessType ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t('step1.businessTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.businessType?.message} />
      </div>

      <div>
        <Label htmlFor="timeInBusiness" className="dark:text-gray-200">{t('step1.timeInBusiness')} *</Label>
        <Controller
          control={control}
          name="timeInBusiness"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="timeInBusiness" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.timeInBusiness ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t('step1.timeInBusinessPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {timePeriods.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.timeInBusiness?.message} />
      </div>

      <div>
        <Label htmlFor="state" className="dark:text-gray-200">{t('step1.state')} *</Label>
        <Controller
          control={control}
          name="state"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="state" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.state ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t('step1.statePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.state?.message} />
      </div>

      <Button type="submit" className="w-full bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white mt-2">
        {t('next')} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

// ── Step 2: Revenue ──────────────────────────────────────────────────────────

function Step2({ defaultValues, onNext, onBack }: { defaultValues: Partial<AllFormData>; onNext: (d: Step2Data) => void; onBack: () => void }) {
  const t = useTranslations('apply');
  const tV = useTranslations('validation');
  const step2Schema = useMemo(() => z.object({
    monthlyRevenue: z.string().min(1, tV('selectRequired')),
    revenueConsistency: z.string().min(1, tV('selectRequired')),
  }), [tV]);
  const { handleSubmit, control, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      monthlyRevenue: defaultValues.monthlyRevenue ?? '',
      revenueConsistency: defaultValues.revenueConsistency ?? '',
    },
  });

  const revenues = [
    { value: 'Under $5K', label: t('step2.revenues.Under $5K') },
    { value: '$5K-$15K', label: t('step2.revenues.$5K-$15K') },
    { value: '$15K-$30K', label: t('step2.revenues.$15K-$30K') },
    { value: '$30K-$75K', label: t('step2.revenues.$30K-$75K') },
    { value: '$75K+', label: t('step2.revenues.$75K+') },
  ];

  const consistencies = [
    { value: 'Stable', label: t('step2.consistencies.Stable') },
    { value: 'Seasonal', label: t('step2.consistencies.Seasonal') },
    { value: 'Growing', label: t('step2.consistencies.Growing') },
    { value: 'Inconsistent', label: t('step2.consistencies.Inconsistent') },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <Label htmlFor="monthlyRevenue" className="dark:text-gray-200">{t('step2.monthlyRevenue')} *</Label>
        <Controller
          control={control}
          name="monthlyRevenue"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="monthlyRevenue" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.monthlyRevenue ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t('step2.monthlyRevenuePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {revenues.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.monthlyRevenue?.message} />
      </div>

      <div>
        <Label htmlFor="revenueConsistency" className="dark:text-gray-200">{t('step2.revenueConsistency')} *</Label>
        <Controller
          control={control}
          name="revenueConsistency"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="revenueConsistency" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.revenueConsistency ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t('step2.revenueConsistencyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {consistencies.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.revenueConsistency?.message} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
        </Button>
        <Button type="submit" className="flex-1 bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white">
          {t('next')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ── Step 3: Loan Details ─────────────────────────────────────────────────────

function Step3({ defaultValues, onNext, onBack }: { defaultValues: Partial<AllFormData>; onNext: (d: Step3Data) => void; onBack: () => void }) {
  const t = useTranslations('apply');
  const tV = useTranslations('validation');
  const step3Schema = useMemo(() => z.object({
    loanPurpose: z.string().min(1, tV('selectRequired')),
    loanAmount: z.string().min(1, tV('selectRequired')),
    urgency: z.string().min(1, tV('selectRequired')),
  }), [tV]);
  const { handleSubmit, control, formState: { errors } } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      loanPurpose: defaultValues.loanPurpose ?? '',
      loanAmount: defaultValues.loanAmount ?? '',
      urgency: defaultValues.urgency ?? '',
    },
  });

  const purposes = [
    { value: 'Working capital', label: t('step3.purposes.Working capital') },
    { value: 'Equipment', label: t('step3.purposes.Equipment') },
    { value: 'Expansion', label: t('step3.purposes.Expansion') },
    { value: 'Inventory', label: t('step3.purposes.Inventory') },
    { value: 'Debt refinancing', label: t('step3.purposes.Debt refinancing') },
    { value: 'Emergency', label: t('step3.purposes.Emergency') },
  ];

  const amounts = [
    { value: '$5K-$25K', label: t('step3.amounts.$5K-$25K') },
    { value: '$25K-$75K', label: t('step3.amounts.$25K-$75K') },
    { value: '$75K-$150K', label: t('step3.amounts.$75K-$150K') },
    { value: '$150K-$500K', label: t('step3.amounts.$150K-$500K') },
    { value: '$500K+', label: t('step3.amounts.$500K+') },
  ];

  const urgencies = [
    { value: 'ASAP (days)', label: t('step3.urgencies.ASAP (days)') },
    { value: 'Within 2 weeks', label: t('step3.urgencies.Within 2 weeks') },
    { value: 'Within a month', label: t('step3.urgencies.Within a month') },
    { value: 'No rush', label: t('step3.urgencies.No rush') },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <Label htmlFor="loanPurpose" className="dark:text-gray-200">{t('step3.loanPurpose')} *</Label>
        <Controller control={control} name="loanPurpose" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="loanPurpose" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.loanPurpose ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('step3.loanPurposePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {purposes.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        <FieldError message={errors.loanPurpose?.message} />
      </div>

      <div>
        <Label htmlFor="loanAmount" className="dark:text-gray-200">{t('step3.loanAmount')} *</Label>
        <Controller control={control} name="loanAmount" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="loanAmount" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.loanAmount ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('step3.loanAmountPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {amounts.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        <FieldError message={errors.loanAmount?.message} />
      </div>

      <div>
        <Label htmlFor="urgency" className="dark:text-gray-200">{t('step3.urgency')} *</Label>
        <Controller control={control} name="urgency" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="urgency" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.urgency ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('step3.urgencyPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {urgencies.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        <FieldError message={errors.urgency?.message} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
        </Button>
        <Button type="submit" className="flex-1 bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white">
          {t('next')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ── Step 4: Owner Info ───────────────────────────────────────────────────────

function Step4({ defaultValues, onNext, onBack }: { defaultValues: Partial<AllFormData>; onNext: (d: Step4Data) => void; onBack: () => void }) {
  const t = useTranslations('apply');
  const tV = useTranslations('validation');
  const step4Schema = useMemo(() => z.object({
    ownerName: z.string().min(2, tV('required')),
    email: z.string().email(tV('invalidEmail')),
    phone: z
      .string()
      .min(7, tV('invalidPhone'))
      .regex(/^[\d\s()\-+.]+$/, tV('invalidPhone')),
    creditScoreRange: z.string().min(1, tV('selectRequired')),
  }), [tV]);
  const { register, handleSubmit, control, formState: { errors } } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      ownerName: defaultValues.ownerName ?? '',
      email: defaultValues.email ?? '',
      phone: defaultValues.phone ?? '',
      creditScoreRange: defaultValues.creditScoreRange ?? '',
    },
  });

  const creditScores = [
    { value: 'Below 500', label: t('step4.creditScores.Below 500') },
    { value: '500-580', label: t('step4.creditScores.500-580') },
    { value: '580-650', label: t('step4.creditScores.580-650') },
    { value: '650-700', label: t('step4.creditScores.650-700') },
    { value: '700+', label: t('step4.creditScores.700+') },
    { value: "I don't know", label: t("step4.creditScores.I don't know") },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <Label htmlFor="ownerName" className="dark:text-gray-200">{t('step4.ownerName')} *</Label>
        <Input
          id="ownerName"
          placeholder={t('step4.ownerNamePlaceholder')}
          className={`mt-1 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.ownerName ? 'border-red-500' : ''}`}
          {...register('ownerName')}
        />
        <FieldError message={errors.ownerName?.message} />
      </div>

      <div>
        <Label htmlFor="email" className="dark:text-gray-200">{t('step4.email')} *</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('step4.emailPlaceholder')}
          className={`mt-1 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.email ? 'border-red-500' : ''}`}
          {...register('email')}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="phone" className="dark:text-gray-200">{t('step4.phone')} *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder={t('step4.phonePlaceholder')}
          className={`mt-1 text-base dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.phone ? 'border-red-500' : ''}`}
          {...register('phone')}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div>
        <Label htmlFor="creditScoreRange" className="dark:text-gray-200">{t('step4.creditScore')} *</Label>
        <Controller control={control} name="creditScoreRange" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id="creditScoreRange" className={`mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.creditScoreRange ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('step4.creditScorePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {creditScores.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        <FieldError message={errors.creditScoreRange?.message} />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {t('step4.privacyNote')}
      </p>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
        </Button>
        <Button type="submit" className="flex-1 bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white">
          {t('next')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ── Step 5: Bank Connection ───────────────────────────────────────────────────

function Step5({
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
}: {
  onSubmit: (plaidToken?: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const t = useTranslations('apply');
  const [bankConnected, setBankConnected] = useState(false);
  const [plaidToken, setPlaidToken] = useState<string | undefined>();
  const [plaidLoading, setPlaidLoading] = useState(false);

  const openPlaidLink = async () => {
    setPlaidLoading(true);
    try {
      const res = await fetch('/api/plaid/link', { method: 'POST' });
      if (!res.ok) throw new Error('Error al obtener el enlace bancario');
      const { link_token } = await res.json() as { link_token: string };

      // Dynamically load Plaid Link
      await new Promise<void>((resolve, reject) => {
        if (document.getElementById('plaid-link-js')) { resolve(); return; }
        const script = document.createElement('script');
        script.id = 'plaid-link-js';
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Plaid'));
        document.head.appendChild(script);
      });

      // @ts-expect-error - Plaid loaded from CDN
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: (public_token: string) => {
          setPlaidToken(public_token);
          setBankConnected(true);
          setPlaidLoading(false);
        },
        onExit: () => {
          setPlaidLoading(false);
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      handler.open();
    } catch (err) {
      console.error('Plaid error:', err);
      setPlaidLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Why connect section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          {t('step5.whyTitle')}
        </h3>
        <p className="text-blue-800 text-sm leading-relaxed">{t('step5.whyBody')}</p>
      </div>

      {bankConnected ? (
        <Alert variant="success">
          <CheckCircle className="h-5 w-5" />
          <AlertDescription>
            <strong>{t('step5.connected')}</strong>
            <br />
            {t('step5.connectedBody')}
          </AlertDescription>
        </Alert>
      ) : (
        <Button
          type="button"
          onClick={openPlaidLink}
          disabled={plaidLoading}
          className="w-full bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white h-12"
        >
          {plaidLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('step5.connecting')}</>
          ) : (
            <><Landmark className="mr-2 h-5 w-5" /> {t('step5.connect')}</>
          )}
        </Button>
      )}

      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <Shield className="h-4 w-4 flex-shrink-0" />
        <span>{t('step5.secure')}</span>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={() => onSubmit(plaidToken)}
          disabled={isSubmitting}
          className="w-full bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white h-12 text-base font-semibold"
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('step5.analyzing')}</>
          ) : bankConnected ? (
            <>{t('submit')} <ArrowRight className="ml-2 h-5 w-5" /></>
          ) : (
            <>{t('step5.skip')} <ArrowRight className="ml-2 h-5 w-5" /></>
          )}
        </Button>

        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
        </Button>
      </div>
    </div>
  );
}

// ── Main Multi-Step Form ──────────────────────────────────────────────────────

export function ApplyForm() {
  const t = useTranslations('apply');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AllFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = useCallback(
    (stepData: Partial<AllFormData>) => {
      const merged = { ...formData, ...stepData };
      setFormData(merged);
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
    },
    [formData]
  );

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleSubmit = useCallback(
    async (plaidPublicToken?: string) => {
      const fullData = { ...formData, plaidPublicToken } as AllFormData;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullData),
        });

        if (!res.ok) {
          const errorData = await res.json() as { error?: string };
          throw new Error(errorData.error ?? t('submitError'));
        }

        const { applicationId } = await res.json() as { applicationId: number };
        router.push(`/results/${applicationId}`);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : t('unknownError')
        );
        setIsSubmitting(false);
      }
    },
    [formData, router]
  );

  const stepIcons = [Building2, DollarSign, FileText, User, Landmark];
  const stepLabels = [
    t('step1.title'),
    t('step2.title'),
    t('step3.title'),
    t('step4.title'),
    t('step5.title'),
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Progress header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('step')} {currentStep} {t('of')} {TOTAL_STEPS}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step icons */}
        <div className="flex justify-between mt-4">
          {stepIcons.map((Icon, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isDone = stepNum < currentStep;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-fondeo-green-600 text-white'
                      : isActive
                      ? 'bg-fondeo-green-700 text-white ring-2 ring-fondeo-green-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-xs hidden sm:block text-center leading-tight max-w-16 ${
                    isActive ? 'text-fondeo-green-700 font-medium' : 'text-gray-400'
                  }`}
                >
                  {stepLabels[i].split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-5">
          {stepLabels[currentStep - 1]}
        </h2>

        {currentStep === 1 && <Step1 defaultValues={formData} onNext={handleNext} />}
        {currentStep === 2 && <Step2 defaultValues={formData} onNext={handleNext} onBack={handleBack} />}
        {currentStep === 3 && <Step3 defaultValues={formData} onNext={handleNext} onBack={handleBack} />}
        {currentStep === 4 && <Step4 defaultValues={formData} onNext={handleNext} onBack={handleBack} />}
        {currentStep === 5 && (
          <Step5
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}
      </div>
    </div>
  );
}
