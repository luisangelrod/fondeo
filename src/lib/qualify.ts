import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// Fail fast at module load — no silent undefined key passed to SDK
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set')
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface BusinessProfile {
  businessName?: string
  businessType: string
  timeInBusiness: string
  monthlyRevenue: string
  revenueConsistency?: string
  loanPurpose: string
  loanAmount: string
  urgency?: string
  creditScoreRange?: string
  state: string
  plaidData?: PlaidSummary
}

export interface PlaidSummary {
  avgMonthlyDeposits: number
  avgMonthlyWithdrawals: number
  monthsAnalyzed: number
  nsfCount: number
  consistencyScore: number
}

export interface QualificationResult {
  lendScore: number
  summary: string
  eligibleProducts: EligibleProduct[]
  lenderMatches: LenderMatchResult[]
  redFlags: string[]
  strengths: string[]
}

export interface EligibleProduct {
  productType: string
  likelihood: 'alta' | 'media' | 'baja'
  estimatedRange: string
  estimatedRate: string
  reasoning: string
}

export interface LenderMatchResult {
  lenderSlug: 'greenbox' | 'onepark' | 'ondeck'
  approvalOdds: 'high' | 'medium' | 'low'
  bestProduct: string
  estimatedAmount: string
  note: string
}

// Runtime Zod schema — validates Claude's response shape before trusting any field.
// Without this, a bad lendScore type (e.g. string "75") silently passes TypeScript
// but crashes the NOT NULL integer DB column at insert time.
const qualificationResultSchema = z.object({
  lendScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  eligibleProducts: z.array(
    z.object({
      productType: z.string(),
      likelihood: z.enum(['alta', 'media', 'baja']),
      estimatedRange: z.string(),
      estimatedRate: z.string(),
      reasoning: z.string(),
    })
  ),
  lenderMatches: z.array(
    z.object({
      lenderSlug: z.enum(['greenbox', 'onepark', 'ondeck']),
      approvalOdds: z.enum(['high', 'medium', 'low']),
      bestProduct: z.string(),
      estimatedAmount: z.string(),
      note: z.string(),
    })
  ),
  redFlags: z.array(z.string()),
  strengths: z.array(z.string()),
})

export async function qualifyBusiness(profile: BusinessProfile): Promise<QualificationResult> {
  // Fix: consistencyScore is 0-10, not 0-100
  const plaidContext = profile.plaidData
    ? `\n\nDATA BANCARIA VERIFICADA (Plaid — usar con prioridad sobre datos declarados):
- Depósitos mensuales promedio: $${profile.plaidData.avgMonthlyDeposits.toLocaleString()}
- Retiros mensuales promedio: $${profile.plaidData.avgMonthlyWithdrawals.toLocaleString()}
- Meses analizados: ${profile.plaidData.monthsAnalyzed}
- Incidentes NSF (posibles): ${profile.plaidData.nsfCount}
- Puntuación de consistencia de ingresos: ${profile.plaidData.consistencyScore}/10`
    : '\n\nDATA BANCARIA: No conectada — análisis basado exclusivamente en perfil declarado por el solicitante.'

  const prompt = `Analiza el siguiente perfil de negocio y evalúa su elegibilidad para financiamiento comercial.

PERFIL DEL NEGOCIO:
- Tipo de negocio: ${profile.businessType}
- Tiempo en operación: ${profile.timeInBusiness}
- Ingresos mensuales declarados: ${profile.monthlyRevenue} (rango — usa el límite INFERIOR para ser conservador)
- Consistencia de ingresos: ${profile.revenueConsistency ?? 'No especificado'}
- Propósito del préstamo: ${profile.loanPurpose}
- Monto solicitado: ${profile.loanAmount}
- Puntuación de crédito aproximada: ${profile.creditScoreRange ?? 'No especificado'}
- Estado/Territorio: ${profile.state}${plaidContext}

PRESTAMISTAS DISPONIBLES Y SUS CRITERIOS EXACTOS:
1. Greenbox Capital — MCA y Línea de Crédito
   • Requisito mínimo: $5,000/mes ingresos, 3+ meses operando, crédito 500+
   • Comisión de referido: 10% del monto financiado
   • Velocidad: 24-48 horas | Atiende Puerto Rico: sí

2. OnePark Financial — MCA y Capital de Trabajo
   • Requisito mínimo: $5,000/mes ingresos, 3+ meses operando, sin mínimo de crédito
   • Comisión de referido: 8% del monto financiado
   • Velocidad: 48 horas | Atiende Puerto Rico: sí

3. OnDeck — Préstamo a Plazo y Línea de Crédito
   • Requisito mínimo: $8,333/mes ingresos, 12+ meses operando, crédito 625+
   • Comisión de referido: 3% del monto financiado
   • Velocidad: mismo día | Atiende Puerto Rico: sí
`

  const scoringTable = `TABLA DE PUNTUACIÓN LEND SCORE (aplica exactamente estos puntos):
Ingresos mensuales:
  IMPORTANTE: El campo "Ingresos mensuales declarados" es un rango (ej: "$30K-$75K").
  Usa siempre el LÍMITE INFERIOR del rango para ser conservador.
  Por ejemplo: "$30K-$75K" → evaluar como $30,000/mes; "$75K+" → evaluar como $75,000/mes.
  Si hay datos Plaid, usar avgMonthlyDeposits en lugar del declarado.
  • $75,000+       → 25 pts
  • $30,000-$74,999 → 22 pts
  • $15,000-$29,999 → 18 pts
  • $8,333-$14,999  → 14 pts
  • $5,000-$8,332   → 10 pts
  • <$5,000         → 3 pts

Tiempo en operación:
  • 24+ meses   → 25 pts
  • 12-23 meses → 20 pts
  • 6-11 meses  → 12 pts
  • 3-5 meses / 3-6 meses / 3-6 months → 6 pts (mínimo para Greenbox y OnePark satisfecho)
  • <3 meses    → 0 pts

Crédito:
  • 700+         → 25 pts
  • 650-699      → 20 pts
  • 625-649      → 16 pts
  • 550-624      → 12 pts
  • 500-549      → 8 pts
  • <500         → 3 pts
  • No especificado → 3 pts

Plaid / Datos bancarios (solo si hay data Plaid):
  • consistencyScore 8-10 → +15 pts
  • consistencyScore 5-7  → +10 pts
  • consistencyScore 0-4  → +3 pts
  • NSF 0           → +0 penalización
  • NSF 1-2         → -5 pts
  • NSF 3+          → -15 pts

Suma los puntos de cada categoría para obtener el lendScore (máximo 100).
Si NO hay datos Plaid, el puntaje máximo posible es 75.

SOLO incluir un prestamista en lenderMatches si el negocio cumple sus requisitos mínimos.
Si el negocio no califica para ningún prestamista, devolver lenderMatches: [].

Responde ÚNICAMENTE con el objeto JSON. Sin explicaciones, sin markdown, sin backticks:
{
  "lendScore": <entero 0-100>,
  "summary": "<2-3 oraciones en español sobre la elegibilidad>",
  "eligibleProducts": [
    {
      "productType": "<nombre>",
      "likelihood": "<alta|media|baja>",
      "estimatedRange": "<ej: $10,000 - $50,000>",
      "estimatedRate": "<ej: factor 1.20 - 1.40>",
      "reasoning": "<1 oración>"
    }
  ],
  "lenderMatches": [
    {
      "lenderSlug": "<greenbox|onepark|ondeck>",
      "approvalOdds": "<high|medium|low>",
      "bestProduct": "<producto más adecuado>",
      "estimatedAmount": "<ej: $25,000 - $75,000>",
      "note": "<1 oración en español>"
    }
  ],
  "redFlags": ["<factor negativo en español>"],
  "strengths": ["<fortaleza en español>"]
}`

  const fullPrompt = prompt + '\n' + scoringTable

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    temperature: 0,
    system:
      'Eres un sistema de calificación de crédito empresarial. Responde SIEMPRE con un objeto JSON válido y nada más — sin markdown, sin backticks, sin texto antes o después del JSON.',
    messages: [{ role: 'user', content: fullPrompt }],
  })

  const textContent = message.content.find(block => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Strip markdown fences that Claude may emit despite instructions
  const raw = textContent.text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  // Step 1: parse JSON — throw with the raw string if it is not valid JSON
  let jsonParsed: unknown
  try {
    jsonParsed = JSON.parse(raw)
  } catch (parseErr) {
    console.error('Claude raw response (unparseable JSON):', raw)
    throw new Error(`Failed to parse qualification JSON: ${String(parseErr)}`)
  }

  // Step 2: validate shape — catches wrong field types (e.g. lendScore:"75") that
  // would silently pass TypeScript's type cast but crash the DB insert at runtime.
  const validation = qualificationResultSchema.safeParse(jsonParsed)
  if (!validation.success) {
    console.error(
      'Claude response failed schema validation:',
      validation.error.flatten(),
      '\nRaw:', raw
    )
    throw new Error(
      `Qualification response schema invalid: ${JSON.stringify(validation.error.flatten())}`
    )
  }
  return validation.data
}

// ── Plaid transaction analysis ───────────────────────────────────────────────

interface PlaidTxn {
  amount: number  // Plaid convention: positive = debit/expense, negative = credit/deposit
  date: string    // YYYY-MM-DD
  name?: string
  merchant_name?: string
  personal_finance_category?: { primary: string } | null
}

/**
 * Summarises 90 days of Plaid transactions into a PlaidSummary for Claude.
 * Plaid sign convention: negative amount = money IN (deposit), positive = money OUT (expense).
 */
export function analyzePlaidTransactions(transactions: PlaidTxn[]): PlaidSummary {
  if (transactions.length === 0) {
    return { avgMonthlyDeposits: 0, avgMonthlyWithdrawals: 0, monthsAnalyzed: 0, nsfCount: 0, consistencyScore: 5 }
  }

  const monthly: Record<string, { deposits: number; withdrawals: number }> = {}
  let nsfCount = 0

  // NSF/overdraft detection by transaction name and category — NOT by amount.
  // The old $25–$39 amount check flagged virtually every small business purchase
  // (supplies, subscriptions, etc.) as a potential NSF fee, producing false
  // negatives across the board. Banks always label these fees explicitly in the
  // transaction name, so name/category matching is both more accurate and
  // bilingual-safe.
  const nsfKeywords = [
    'non-sufficient', 'nsf', 'returned item', 'overdraft fee',
    'insufficient funds', 'returned payment', 'bounced check',
    'cargo por fondos insuficientes', 'cargo nsf',
  ]

  const isNsfFee = (txn: PlaidTxn): boolean => {
    const name = (txn.name || txn.merchant_name || '').toLowerCase()
    return (
      nsfKeywords.some(kw => name.includes(kw)) ||
      name.includes('overdraft')
    )
  }

  for (const txn of transactions) {
    const month = txn.date.substring(0, 7) // 'YYYY-MM'
    if (!monthly[month]) monthly[month] = { deposits: 0, withdrawals: 0 }

    if (txn.amount < 0) {
      monthly[month].deposits += Math.abs(txn.amount)
    } else {
      monthly[month].withdrawals += txn.amount
      if (isNsfFee(txn)) nsfCount++
    }
  }

  const months = Object.values(monthly)
  const monthsAnalyzed = months.length

  const avgMonthlyDeposits = months.reduce((s, m) => s + m.deposits, 0) / monthsAnalyzed
  const avgMonthlyWithdrawals = months.reduce((s, m) => s + m.withdrawals, 0) / monthsAnalyzed

  // Consistency score: coefficient of variation → 0-10 (10 = perfectly consistent)
  let consistencyScore = 5
  if (avgMonthlyDeposits > 0 && months.length > 1) {
    const variance = months.reduce((s, m) => s + Math.pow(m.deposits - avgMonthlyDeposits, 2), 0) / months.length
    const cv = Math.sqrt(variance) / avgMonthlyDeposits
    consistencyScore = Math.max(0, Math.min(10, Math.round((1 - Math.min(cv, 1)) * 10)))
  }

  return {
    avgMonthlyDeposits: Math.round(avgMonthlyDeposits),
    avgMonthlyWithdrawals: Math.round(avgMonthlyWithdrawals),
    monthsAnalyzed,
    nsfCount,
    consistencyScore,
  }
}
