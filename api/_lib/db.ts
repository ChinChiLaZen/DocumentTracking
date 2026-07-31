import { sql } from '@vercel/postgres'

let schemaReady: Promise<void> | null = null

/** Idempotent — safe to call on every cold start; avoids requiring a manual migration step. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `.then(() => undefined)
  }
  return schemaReady
}

export { sql }
