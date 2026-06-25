import { pgTable, text, integer, timestamp, jsonb, boolean, decimal, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  businessName: text('business_name').notNull(),
  ownerName: text('owner_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  businessType: text('business_type').notNull(),
  state: text('state').notNull(),
  monthlyRevenue: text('monthly_revenue').notNull(),
  revenueConsistency: text('revenue_consistency'),
  timeInBusiness: text('time_in_business').notNull(),
  creditScoreRange: text('credit_score_range'),
  loanPurpose: text('loan_purpose').notNull(),
  loanAmount: text('loan_amount').notNull(),
  urgency: text('urgency'),
  plaidConnected: boolean('plaid_connected').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const plaidConnections = pgTable('plaid_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').references(() => businesses.id).notNull(),
  accessToken: text('access_token').notNull(),
  itemId: text('item_id').notNull(),
  institutionName: text('institution_name'),
  lastSynced: timestamp('last_synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  // itemId must be unique: one Plaid Item per connection. Also the webhook
  // lookup key — without an index every webhook triggers a full table scan.
  uniqueIndex('plaid_connections_item_id_idx').on(t.itemId),
  index('plaid_connections_business_id_idx').on(t.businessId),
])

export const aiQualifications = pgTable('ai_qualifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').references(() => businesses.id).notNull(),
  lendScore: integer('lend_score').notNull(),
  summary: text('summary').notNull(),
  eligibleProducts: jsonb('eligible_products').notNull(),
  lenderMatches: jsonb('lender_matches').notNull(),
  redFlags: jsonb('red_flags'),
  strengths: jsonb('strengths'),
  rawPrompt: text('raw_prompt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('ai_qualifications_business_id_idx').on(t.businessId),
])

export const lenderMatches = pgTable('lender_matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').references(() => businesses.id).notNull(),
  qualificationId: uuid('qualification_id').references(() => aiQualifications.id),
  lenderSlug: text('lender_slug').notNull(),
  lenderName: text('lender_name').notNull(),
  approvalOdds: text('approval_odds').notNull(),
  estimatedAmount: text('estimated_amount'),
  estimatedRate: text('estimated_rate'),
  bestProduct: text('best_product'),
  note: text('note'),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('lender_matches_business_id_idx').on(t.businessId),
  index('lender_matches_qualification_id_idx').on(t.qualificationId),
])

export const leadSubmissions = pgTable('lead_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').references(() => businesses.id).notNull(),
  lenderMatchId: uuid('lender_match_id').references(() => lenderMatches.id),
  lenderSlug: text('lender_slug').notNull(),
  lenderName: text('lender_name').notNull(),
  status: text('status').notNull().default('submitted'),
  // Commission tracking
  commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }),
  // Set when the lender actually funds the deal (via admin PATCH or webhook)
  fundedAmount: decimal('funded_amount', { precision: 12, scale: 2 }),
  // Set when Fondeo receives the commission payment from the lender
  commissionPaidAt: timestamp('commission_paid_at'),
  commissionPaidAmount: decimal('commission_paid_amount', { precision: 12, scale: 2 }),
  confirmedAt: timestamp('confirmed_at'),
  confirmationMethod: text('confirmation_method'),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (t) => [
  // businessId + lenderSlug are queried together in the duplicate-guard check
  index('lead_submissions_business_lender_idx').on(t.businessId, t.lenderSlug),
  index('lead_submissions_lender_match_id_idx').on(t.lenderMatchId),
])

// Inferred row types for use across the app
export type Business = typeof businesses.$inferSelect
export type LenderMatch = typeof lenderMatches.$inferSelect
export type LeadSubmission = typeof leadSubmissions.$inferSelect
export type AiQualification = typeof aiQualifications.$inferSelect
export type PlaidConnection = typeof plaidConnections.$inferSelect
