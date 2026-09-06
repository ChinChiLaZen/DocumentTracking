import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// api/_lib/db.ts's ensureSchema() runs a long CREATE TABLE/ALTER TABLE chain
// through `sql` on first call (memoized module-wide) before any handler code
// runs — this mock is content-based (inspects the query's literal text)
// rather than call-order-based, so it doesn't care how many/which order
// those setup queries fire relative to the handler's own queries.
interface DbState {
  templatesRows: Array<{ id: string; is_builtin: boolean; label: string; description: string; definition: unknown }>
  usageCount: number
  deletedRows: Array<{ id: string }>
  upsertedRow: { id: string; is_builtin: boolean; label: string; description: string; definition: unknown } | null
}

const dbState: DbState = { templatesRows: [], usageCount: 0, deletedRows: [], upsertedRow: null }

const sqlMock = vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
  void values
  const text = strings.join(' ')
  if (text.includes('SELECT id, is_builtin, label, description, definition FROM checklist_templates')) {
    return Promise.resolve({ rows: dbState.templatesRows })
  }
  if (text.includes("SELECT COUNT(*) AS count FROM project_records")) {
    return Promise.resolve({ rows: [{ count: String(dbState.usageCount) }] })
  }
  if (text.includes('DELETE FROM checklist_templates')) {
    return Promise.resolve({ rows: dbState.deletedRows })
  }
  if (text.includes('INSERT INTO checklist_templates')) {
    return Promise.resolve({ rows: dbState.upsertedRow ? [dbState.upsertedRow] : [] })
  }
  return Promise.resolve({ rows: [] })
})

vi.mock('@vercel/postgres', () => ({ sql: sqlMock }))

const getCurrentUserMock = vi.fn()
const requireAdminMock = vi.fn()
vi.mock('../_lib/auth.js', () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
  requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
}))

const { default: handler } = await import('./index.js')

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'GET', query: {}, body: {}, headers: {}, ...overrides } as unknown as VercelRequest
}

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
      return res
    },
  }
  return res as unknown as VercelResponse & typeof res
}

const VALID_DEFINITION = {
  label: 'Custom Flat Template',
  description: 'A flat, single-tab template.',
  tabSet: 'single' as const,
  hasDetailSheets: false,
  hasGroups: false,
  hasPriority: false,
  supportsDefaultPhase: false,
  groups: [],
  priorities: [],
  items: [{ no: 1, name: 'Item one', standard: '', requirement: '' }],
  sheets: [],
}

beforeEach(() => {
  dbState.templatesRows = []
  dbState.usageCount = 0
  dbState.deletedRows = []
  dbState.upsertedRow = null
  sqlMock.mockClear()
  getCurrentUserMock.mockReset()
  requireAdminMock.mockReset()
})

describe('api/templates/index handler', () => {
  it('405s an unsupported method', async () => {
    const req = mockReq({ method: 'POST' })
    const res = mockRes()
    await handler(req, res)
    expect(res.statusCode).toBe(405)
  })

  describe('GET', () => {
    it('401s when not signed in', async () => {
      getCurrentUserMock.mockResolvedValue(null)
      const req = mockReq({ method: 'GET' })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(401)
    })

    it('returns override/custom rows for any signed-in user, spreading definition into the template', async () => {
      getCurrentUserMock.mockResolvedValue({ id: 1, email: 'member@example.com', role: 'member', isActive: true })
      dbState.templatesRows = [
        {
          id: 'custom-1',
          is_builtin: false,
          label: 'Custom',
          description: 'desc',
          definition: { tabSet: 'single', hasDetailSheets: false, hasGroups: false, hasPriority: false, supportsDefaultPhase: false, groups: [], priorities: [], items: [], sheets: [] },
        },
      ]
      const req = mockReq({ method: 'GET' })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(200)
      const body = res.body as { templates: Array<Record<string, unknown>> }
      expect(body.templates).toHaveLength(1)
      expect(body.templates[0]).toMatchObject({ id: 'custom-1', isBuiltin: false, label: 'Custom', tabSet: 'single' })
    })
  })

  describe('PUT', () => {
    it('403s when not admin', async () => {
      requireAdminMock.mockResolvedValue(null)
      const req = mockReq({ method: 'PUT', query: { id: 'custom-1' }, body: { definition: VALID_DEFINITION } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(403)
    })

    it('400s when the id query param is missing', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      const req = mockReq({ method: 'PUT', query: {}, body: { definition: VALID_DEFINITION } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(400)
    })

    it('400s on an invalid definition shape', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      const req = mockReq({
        method: 'PUT',
        query: { id: 'custom-1' },
        body: { definition: { ...VALID_DEFINITION, tabSet: 'nonsense' } },
      })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(400)
    })

    it('upserts a custom template and marks it not built-in', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      const { label, description, ...rest } = VALID_DEFINITION
      dbState.upsertedRow = { id: 'custom-1', is_builtin: false, label, description, definition: rest }
      const req = mockReq({ method: 'PUT', query: { id: 'custom-1' }, body: { definition: VALID_DEFINITION } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(200)
      const body = res.body as { template: Record<string, unknown> }
      expect(body.template).toMatchObject({ id: 'custom-1', isBuiltin: false, label: VALID_DEFINITION.label })

      // The is_builtin flag passed to the INSERT is computed server-side from
      // the id, never trusted from the client — verify a built-in id (e.g.
      // 'mar') is flagged true while a custom id is flagged false.
      const insertCall = sqlMock.mock.calls.find((call) => (call[0] as TemplateStringsArray).join(' ').includes('INSERT INTO checklist_templates'))
      expect(insertCall).toBeDefined()
      const isBuiltinArg = insertCall![2] // VALUES (${id}, ${BUILTIN_IDS.has(id)}, ...) — second substitution
      expect(isBuiltinArg).toBe(false)
    })

    it('marks an override of a built-in id (e.g. mar) as is_builtin true', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      dbState.upsertedRow = { id: 'mar', is_builtin: true, label: 'MAR', description: 'd', definition: VALID_DEFINITION }
      const req = mockReq({ method: 'PUT', query: { id: 'mar' }, body: { definition: VALID_DEFINITION } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(200)
      const insertCall = sqlMock.mock.calls.find((call) => (call[0] as TemplateStringsArray).join(' ').includes('INSERT INTO checklist_templates'))
      expect(insertCall![2]).toBe(true)
    })
  })

  describe('DELETE', () => {
    it('403s when not admin', async () => {
      requireAdminMock.mockResolvedValue(null)
      const req = mockReq({ method: 'DELETE', query: { id: 'custom-1' } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(403)
    })

    it('400s when the id query param is missing', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      const req = mockReq({ method: 'DELETE', query: {} })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(400)
    })

    it('409s deleting a custom template still used by a project, without deleting it', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      dbState.usageCount = 2
      const req = mockReq({ method: 'DELETE', query: { id: 'custom-1' } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(409)
      const deleteCall = sqlMock.mock.calls.find((call) => (call[0] as TemplateStringsArray).join(' ').includes('DELETE FROM checklist_templates'))
      expect(deleteCall).toBeUndefined()
    })

    it('deletes an unused custom template', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      dbState.usageCount = 0
      dbState.deletedRows = [{ id: 'custom-1' }]
      const req = mockReq({ method: 'DELETE', query: { id: 'custom-1' } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ ok: true })
    })

    it('deletes a built-in override without running the in-use guard', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      dbState.deletedRows = [{ id: 'mar' }]
      const req = mockReq({ method: 'DELETE', query: { id: 'mar' } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(200)
      const usageCall = sqlMock.mock.calls.find((call) =>
        (call[0] as TemplateStringsArray).join(' ').includes('SELECT COUNT(*) AS count FROM project_records'),
      )
      expect(usageCall).toBeUndefined()
    })

    it('404s when there is no override row to delete', async () => {
      requireAdminMock.mockResolvedValue({ id: 1, email: 'admin@example.com' })
      dbState.deletedRows = []
      const req = mockReq({ method: 'DELETE', query: { id: 'mar' } })
      const res = mockRes()
      await handler(req, res)
      expect(res.statusCode).toBe(404)
    })
  })
})
