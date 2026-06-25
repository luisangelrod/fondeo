import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// In Next.js App Router serverless deployments, each function invocation can
// spin up a fresh postgres.js pool. Without an upper bound, a sudden traffic
// spike creates hundreds of simultaneous pools that exhaust DB connections.
// max:10 is a reasonable ceiling for a Vercel/Neon free-tier setup; tune up
// for larger Postgres instances or connection-pooler setups (PgBouncer, etc.).
const queryClient = postgres(process.env.DATABASE_URL, { 
  max: 10,
  connect_timeout: 10,   // 10 seconds to establish connection
  idle_timeout: 20,      // close idle connections after 20 seconds
  max_lifetime: 1800,    // max connection lifetime 30 minutes
})
export const db = drizzle(queryClient, { schema })
export type DB = typeof db
