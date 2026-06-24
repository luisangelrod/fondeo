# Fondeo Deployment Guide

## Prerequisites (do these in parallel — they take time)

### 1. Clerk (auth) — 5 min
1. Go to clerk.com → Create application → "Fondeo"
2. Copy NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
3. In Clerk dashboard → JWT Templates → create one named "supabase"

### 2. Supabase (database) — 10 min
1. Go to supabase.com → New project → "fondeo" in region US East
2. Settings → Database → Connection string → copy to DATABASE_URL
3. After env is set, run: `bash scripts/setup-db.sh`

### 3. Anthropic API key — 2 min
1. Go to console.anthropic.com → API Keys → Create key
2. Copy to ANTHROPIC_API_KEY

### 4. Plaid (bank connection) — START NOW, takes 2–4 weeks for Production
1. Go to dashboard.plaid.com → Create account
2. Create app → get PLAID_CLIENT_ID and PLAID_SECRET
3. Use sandbox (PLAID_ENV=sandbox) for dev, apply for Production immediately
4. Apply at: dashboard.plaid.com/team/request-access → "Small Business Lending"

### 5. Resend (email) — 5 min
1. Go to resend.com → Create API key
2. Add your domain (fondeo.app or your domain) → verify DNS
3. Copy to RESEND_API_KEY and set RESEND_FROM=noreply@yourdomain.com


## Deploy to Vercel

```bash
npm install -g vercel
vercel login
cd ~/Downloads/fondeo
vercel --prod
```

When prompted, add all env vars from .env.local.

Or go to vercel.com → Import Git Repository → select **fondeo**.

## Required Environment Variables

```
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=

# AI
ANTHROPIC_API_KEY=

# Plaid
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox

# Email
RESEND_API_KEY=
RESEND_FROM=

# App
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
ADMIN_USER_ID=
```

## Post-deploy checklist
- [ ] Set NEXT_PUBLIC_APP_URL to your Vercel URL in Vercel dashboard
- [ ] Set ADMIN_USER_ID to your Clerk user ID (find it in Clerk dashboard → Users)
- [ ] Run the DB migration: `bash scripts/setup-db.sh`
- [ ] Test the full flow: apply → Plaid → results → submit to lender
- [ ] Register as ISO partner with Greenbox: greenboxcapital.com/iso-program/
- [ ] Register as ISO partner with OnePark: oneparkfinancial.com/partner
- [ ] Register as affiliate with OnDeck: ondeck.com/partner/referral
