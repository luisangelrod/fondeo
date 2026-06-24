# Fondeo

**Fondeo** is a bilingual (Spanish-first / English) small business loan matching platform for Puerto Rico and US Hispanic SMBs. Borrowers get matched to lenders for free; lenders pay a 1–19% referral commission when a loan closes.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router (TypeScript strict) |
| Auth | Clerk v6 |
| Database | Drizzle ORM + Supabase Postgres (UUID PKs) |
| AI | Anthropic claude-sonnet-4-6 |
| Banking | Plaid (sandbox/production) |
| Email | Resend |
| i18n | next-intl v3 — Spanish default locale |
| UI | Tailwind CSS v3 + shadcn/ui components |
| Forms | react-hook-form + Zod (Spanish errors) |

## Environment Variables

Copy `.env.local` and fill in real values before deploying:

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/apply

# Supabase Postgres
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres

# Plaid
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox   # change to "production" when ready

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Resend (email)
RESEND_API_KEY=re_...
RESEND_FROM=noreply@fondeo.app

# Admin (your Clerk user ID + email)
ADMIN_USER_ID=user_...
ADMIN_EMAIL=you@example.com

# App URL (no trailing slash)
NEXT_PUBLIC_APP_URL=https://fondeo.app
```

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local   # or edit .env.local directly

# 3. Push database schema to Supabase
npx drizzle-kit push

# 4. Start development server
npm run dev
# → http://localhost:3000  (redirects to /es by default)
# → http://localhost:3000/en  (English)
```

## Database Migrations

Drizzle is configured for Supabase Postgres with UUID primary keys.

```bash
# Push schema changes directly (no migration files)
npx drizzle-kit push

# OR generate and apply migration files
npx drizzle-kit generate
npx drizzle-kit migrate

# Open Drizzle Studio
npx drizzle-kit studio
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # next-intl locale routing (default: es)
│   │   ├── page.tsx       # Landing page
│   │   ├── apply/         # 5-step eligibility quiz (Plaid optional)
│   │   ├── results/[id]/  # AI qualification results + lender cards
│   │   ├── dashboard/     # Borrower dashboard — score, lead status
│   │   └── admin/         # Admin panel — lead pipeline, commissions
│   ├── sign-in/           # Clerk auth (locale-free routes)
│   ├── sign-up/
│   └── api/
│       ├── applications/  # POST — create business, run AI qualification
│       ├── leads/submit/  # POST — send lead to lender, email notification
│       ├── qualify/       # POST — re-run AI qualification
│       ├── plaid/link/    # POST — create Plaid link token
│       ├── plaid/exchange/# POST — exchange public token, save access token
│       ├── admin/leads/   # PATCH — update lead status / funded amount
│       └── webhooks/plaid/# POST — Plaid transaction update webhooks
├── components/
│   ├── nav-bar.tsx
│   └── ui/                # shadcn/ui components (button, card, badge, …)
├── db/
│   ├── index.ts           # Drizzle client
│   └── schema.ts          # Postgres schema (UUID PKs throughout)
├── i18n/
│   ├── routing.ts         # Locale routing config
│   └── request.ts         # next-intl server config
├── lib/
│   ├── lenders.ts         # Lender profiles + eligibility matching
│   ├── qualify.ts         # Claude AI qualification + Plaid analysis
│   └── utils.ts           # cn(), formatCurrency(), getLendScoreLabel()
├── middleware.ts           # Clerk + next-intl combined middleware
└── navigation.ts           # next-intl typed navigation helpers
messages/
├── es.json                # Spanish translations (default)
└── en.json                # English translations
```

## User Flow

1. **Landing** (`/`) → bilingual hero, CTA to sign up
2. **Sign up** (`/sign-up`) → Clerk auth
3. **Apply** (`/apply`) → 5-step quiz:
   - Business basics (type, time, state)
   - Revenue & consistency
   - Loan purpose, amount, urgency
   - Owner info & credit range
   - Optional Plaid bank connection
4. **Results** (`/results/:businessId`) → AI LendScore, lender cards with `Apply` button
5. **Dashboard** (`/dashboard`) → score, lead status table, re-apply link
6. **Admin** (`/admin`) → full lead pipeline, commission tracking

## Lenders

| Lender | Commission | Min Monthly Revenue | Min Credit |
|---|---|---|---|
| Greenbox Capital | 10% | $5,000 | 500 |
| OnePark Financial | 8% | $5,000 | None |
| OnDeck | 3% | $8,333 | 625 |

To add lenders, edit `src/lib/lenders.ts` — add a new `LenderSlug`, update the `LENDERS` record, and Claude's prompt in `src/lib/qualify.ts`.

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Set env vars in Vercel dashboard or via CLI:
vercel env add CLERK_SECRET_KEY
vercel env add DATABASE_URL
# ... (all vars from the table above)

# Push DB schema against production
DATABASE_URL=<prod_url> npx drizzle-kit push

# Production deploy
vercel --prod
```

**Important Vercel settings:**
- Framework Preset: Next.js
- Root Directory: `.` (default)
- Build Command: `npm run build` (default)
- No additional build flags needed

## Admin Access

The `/admin` route is guarded by `ADMIN_USER_ID` env var (your Clerk user ID). After signing in, visit `/admin` to see the lead pipeline. To mark a lead as funded and record the commission amount, send:

```bash
curl -X PATCH https://your-domain.com/api/admin/leads \
  -H "Content-Type: application/json" \
  -d '{"leadId":"<uuid>","status":"funded","commissionAmount":"2500.00"}'
```

## Business Model

- **Free for borrowers** — no fees, ever
- **Lenders pay referral commissions** (3–10%) when a loan closes
- **Borrowers control privacy** — they choose exactly which lenders see their data before submitting
- **Anti-spam** — submitting to a lender is a deliberate one-click action
