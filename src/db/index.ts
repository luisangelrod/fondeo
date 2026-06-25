import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Lazy singleton — defers the env-var check to request time, not module load
// time, so Next.js static-analysis during `next build` doesn't error out when
// DATABASE_URL is absent (e.g. CI environments, Vercel build workers).
let _db: ReturnType<typeof createDb> | undefined

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  const client = postgres(process.env.DATABASE_URL, {
    max: 10,
    connect_timeout: 10,  // 10 seconds to establish connection
    idle_timeout: 20,     // close idle connections after 20 seconds
    max_lifetime: 1800,   // max connection lifetime 30 minutes
  })
  return drizzle(client, { schema })
}

// Proxy that initialises the real db on first property access.
// Drizzle uses method chaining; binding preserves `this` for each call.
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop: string | symbol) {
    if (!_db) _db = createDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (_db as any)[prop]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof value === 'function' ? (value as (...args: any[]) => any).bind(_db) : value
  },
})

export type DB = typeof db
