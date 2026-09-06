import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../_lib/db.js'
import { getCurrentUser, requireAdmin } from '../_lib/auth.js'
import { isValidTemplateDefinition, type TemplateDefinitionInput } from '../_lib/validateTemplateDefinition.js'

// The 4 templates this app ships with — never stored as rows here (they stay
// static TS files, see src/domain/templateRegistry.ts). A row with one of
// these ids is an admin's *override* of the shipped default; any other id is
// a brand-new custom template.
const BUILTIN_IDS = new Set(['mar', 'aot', 'doa', 'adsb'])

// One file for the whole /api/templates surface, mirroring api/projects/
// index.ts's method + ?id= query-param dispatch — Vercel's plain
// (non-Next.js) Functions cap a deployment at 12 serverless functions (see
// CLAUDE.md §10), and this repo was already at that cap, so this route only
// exists because api/auth/team.ts was folded into api/auth/users.ts to free
// a slot rather than adding a 13th file.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()

  if (req.method === 'GET') {
    // Any signed-in user — non-admins still need to read the registry to
    // populate Add Project's Template picker, they just can't write to it.
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    const result = await sql`SELECT id, is_builtin, label, description, definition FROM checklist_templates ORDER BY seq ASC`
    const templates = result.rows.map((row) => ({
      id: row.id,
      isBuiltin: row.is_builtin,
      label: row.label,
      description: row.description,
      ...row.definition,
    }))
    res.status(200).json({ templates })
    return
  }

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) {
    res.status(400).json({ error: 'id query param is required' })
    return
  }

  // Template management is admin-only both client- and server-side
  // (deliberately stricter than most of this app's client-only gates) — a
  // template is structural/global and a bad edit affects every future
  // project created from it, unlike a single project's own data.
  const caller = await requireAdmin(req)
  if (!caller) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }

  if (req.method === 'DELETE') {
    if (!BUILTIN_IDS.has(id)) {
      const usage = await sql`SELECT COUNT(*) AS count FROM project_records WHERE meta->>'templateKind' = ${id}`
      const count = Number(usage.rows[0]?.count ?? 0)
      if (count > 0) {
        res.status(409).json({ error: `${count} project(s) still use this template — cannot delete it` })
        return
      }
    }
    // For a built-in id this just deletes the override row, reverting future
    // "Add Project" clones to the shipped default — always safe, the static
    // fallback always exists.
    const result = await sql`DELETE FROM checklist_templates WHERE id = ${id} RETURNING id`
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Template override not found' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  // PUT — upserts an override (built-in id) or a custom template (any other
  // id, generated client-side before the first save — see useTemplateStore.ts).
  const { definition } = (req.body ?? {}) as { definition?: unknown }
  if (!isValidTemplateDefinition(definition)) {
    res.status(400).json({ error: 'definition must be a valid template definition' })
    return
  }
  const d = definition as TemplateDefinitionInput
  const { label, description, ...rest } = d

  const upserted = await sql`
    INSERT INTO checklist_templates (id, is_builtin, label, description, definition, created_by)
    VALUES (${id}, ${BUILTIN_IDS.has(id)}, ${label}, ${description}, ${JSON.stringify(rest)}::jsonb, ${caller.email})
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      description = EXCLUDED.description,
      definition = EXCLUDED.definition,
      updated_at = now()
    RETURNING id, is_builtin, label, description, definition
  `
  const row = upserted.rows[0]
  res.status(200).json({
    template: { id: row.id, isBuiltin: row.is_builtin, label: row.label, description: row.description, ...row.definition },
  })
}
