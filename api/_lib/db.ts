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
      .then(() => sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`)
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
      .then(
        // Single shared row (id=1) — the Find Projects page's e-GP snapshot,
        // team-wide rather than per-user or per-browser (see api/procurement/leads.ts).
        () => sql`
          CREATE TABLE IF NOT EXISTS procurement_leads_snapshot (
            id INTEGER PRIMARY KEY,
            leads JSONB NOT NULL,
            captured_date TEXT NOT NULL,
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `,
      )
      .then(
        // Documents attached to a Find Projects lead — lead_id is a loose text
        // key (derived deterministically from the lead's project number, not a
        // foreign key), since leads themselves live in the JSONB snapshot blob
        // above, not as normalized rows (see domain/procurementLeadId.ts and
        // api/procurement/documents.ts).
        // file_data is base64 TEXT, not BYTEA — @vercel/postgres's sql`` tag
        // only accepts string | number | boolean | null | undefined params
        // (no Buffer/Uint8Array), so base64-as-text avoids fighting that.
        () => sql`
          CREATE TABLE IF NOT EXISTS procurement_lead_documents (
            id SERIAL PRIMARY KEY,
            lead_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            content_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_data TEXT NOT NULL,
            uploaded_by TEXT NOT NULL,
            uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `,
      )
      .then(() => sql`CREATE INDEX IF NOT EXISTS idx_procurement_lead_documents_lead_id ON procurement_lead_documents(lead_id)`)
      .then(() => undefined)
  }
  return schemaReady
}

export { sql }
