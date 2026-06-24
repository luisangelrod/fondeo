export type LenderSlug = 'greenbox' | 'onepark' | 'ondeck'

export interface Lender {
  slug: LenderSlug
  name: string
  tagline: string
  descriptionEs: string
  descriptionEn: string
  products: string[]
  minMonthlyRevenue: number
  minTimeInBusiness: number // months
  minCreditScore: number
  fundingSpeed: string
  servesPR: boolean
  commissionRate: number
  isoPortalUrl: string
  features: string[]
  logo: string
}

/** Alias used by lender-card component */
export type LenderProfile = Lender

export const LENDERS: Record<LenderSlug, Lender> = {
  greenbox: {
    slug: 'greenbox',
    name: 'Greenbox Capital',
    tagline: 'Especialistas en financiamiento para negocios en Puerto Rico',
    descriptionEs: 'Especialistas en adelantos de efectivo y líneas de crédito para negocios en Puerto Rico.',
    descriptionEn: 'Cash advance and credit line specialists for businesses in Puerto Rico.',
    products: ['Adelanto de Efectivo (MCA)', 'Línea de Crédito Empresarial'],
    minMonthlyRevenue: 5000,
    minTimeInBusiness: 3,
    minCreditScore: 500,
    fundingSpeed: '24-48 horas',
    servesPR: true,
    commissionRate: 0.10,
    isoPortalUrl: 'https://www.greenboxcapital.com/iso-program/',
    features: ['Sin verificación de crédito mínimo', 'Fondos en 24-48 hrs', 'Atiende Puerto Rico'],
    logo: '/lenders/greenbox.svg',
  },
  onepark: {
    slug: 'onepark',
    name: 'OnePark Financial',
    tagline: 'Capital de trabajo rápido para tu negocio',
    descriptionEs: 'Capital de trabajo rápido para negocios hispanos, sin mínimo de crédito.',
    descriptionEn: 'Fast working capital for Hispanic businesses, no minimum credit score.',
    products: ['Adelanto de Efectivo', 'Capital de Trabajo'],
    minMonthlyRevenue: 5000,
    minTimeInBusiness: 3,
    minCreditScore: 0,
    fundingSpeed: '48 horas',
    servesPR: true,
    commissionRate: 0.08,
    isoPortalUrl: 'https://www.oneparkfinancial.com/partner',
    features: ['Sin puntuación de crédito mínima', 'Proceso 100% en línea', 'Oficina en San Juan'],
    logo: '/lenders/onepark.svg',
  },
  ondeck: {
    slug: 'ondeck',
    name: 'OnDeck',
    tagline: 'Préstamos y líneas de crédito para negocios establecidos',
    descriptionEs: 'Préstamos a plazo y líneas de crédito renovables para negocios con más de 1 año de operación.',
    descriptionEn: 'Term loans and revolving credit lines for businesses with 1+ year of operation.',
    products: ['Préstamo a Plazo', 'Línea de Crédito'],
    minMonthlyRevenue: 8333,
    minTimeInBusiness: 12,
    minCreditScore: 625,
    fundingSpeed: 'Mismo día',
    servesPR: true,
    commissionRate: 0.03,
    isoPortalUrl: 'https://www.ondeck.com/partner/referral',
    features: ['Tasas competitivas', 'Fondos el mismo día', 'Línea de crédito renovable'],
    logo: '/lenders/ondeck.svg',
  },
}

export function getLenderMatch(
  monthlyRevenue: number,
  timeInBusinessMonths: number,
  creditScore: number
): LenderSlug[] {
  return (Object.entries(LENDERS) as [LenderSlug, Lender][])
    .filter(([, lender]) => (
      monthlyRevenue >= lender.minMonthlyRevenue &&
      timeInBusinessMonths >= lender.minTimeInBusiness &&
      creditScore >= lender.minCreditScore
    ))
    .map(([slug]) => slug)
}

// ── Form-string parsers ───────────────────────────────────────────────────────
// The application form collects ranges as strings (e.g. "5k_to_15k").
// These helpers convert them to conservative lower-bound numbers so
// getLenderMatch() can be used as a hard-rule guardrail against AI matches.

const REVENUE_LOWER_BOUND: Record<string, number> = {
  under_5k:     0,
  '5k_to_15k':  5_000,
  '15k_to_30k': 15_000,
  '30k_to_50k': 30_000,
  over_50k:     50_000,
}

const TIME_IN_BUSINESS_MONTHS: Record<string, number> = {
  under_3_months:  1,
  '3_to_6_months': 3,
  '6_to_12_months': 6,
  '1_to_2_years':  12,
  over_2_years:    24,
}

const CREDIT_SCORE_LOWER_BOUND: Record<string, number> = {
  below_500:    0,
  '500_to_549': 500,
  '550_to_599': 550,
  '600_to_649': 600,
  '650_to_699': 650,
  '700_plus':   700,
  unknown:      0,
}

/** Convert a form revenue-range string to its lower-bound dollar value. */
export function parseMonthlyRevenue(range: string): number {
  return REVENUE_LOWER_BOUND[range] ?? 0
}

/** Convert a form time-in-business string to months. */
export function parseTimeInBusiness(range: string): number {
  return TIME_IN_BUSINESS_MONTHS[range] ?? 0
}

/** Convert a form credit-score-range string to its lower-bound score. */
export function parseCreditScore(range: string): number {
  return CREDIT_SCORE_LOWER_BOUND[range] ?? 0
}

/**
 * Wrapper for getLenderMatch() that accepts the raw form string values.
 * Use this in routes instead of getLenderMatch() to avoid type mismatches.
 * Returns only lenders whose hard minimums the business meets.
 */
export function getLenderMatchFromStrings(
  monthlyRevenue: string,
  timeInBusiness: string,
  creditScore: string,
): LenderSlug[] {
  return getLenderMatch(
    parseMonthlyRevenue(monthlyRevenue),
    parseTimeInBusiness(timeInBusiness),
    parseCreditScore(creditScore ?? 'unknown'),
  )
}
