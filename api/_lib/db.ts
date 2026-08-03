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
    `
      .then(() => sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'`)
      .then(
        () => sql`
          CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ToDo',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `,
      )
      .then(() => undefined)
  }
  return schemaReady
}

export { sql }
