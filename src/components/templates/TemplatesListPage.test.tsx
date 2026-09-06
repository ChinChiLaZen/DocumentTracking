import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

// Same technique as TemplateEditorPage.test.tsx — see its comment.
vi.mock('../../store/useTemplateStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/useTemplateStore')>()
  const { createMemoryPersistence } = await import('../../store/persistence')
  return { ...actual, useTemplateStore: actual.createTemplateStore(createMemoryPersistence()) }
})

const { TemplatesListPage } = await import('./TemplatesListPage')
const { useTemplateStore } = await import('../../store/useTemplateStore')

function renderList() {
  return render(
    <MemoryRouter initialEntries={['/templates']}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/templates" element={<TemplatesListPage />} />
        <Route path="/templates/new" element={<div>New template editor</div>} />
        <Route path="/templates/:templateId" element={<div>Template editor</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  useAuthStore.setState({ user: null })
})

describe('TemplatesListPage', () => {
  it('redirects a non-admin to /', () => {
    useAuthStore.setState({ user: { email: 'member@example.com', role: 'member' } })
    renderList()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('lists all 4 built-in templates for an admin, labeled Built-in', () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    renderList()
    for (const label of [
      'MAR — Vendor Approval Checklist',
      'AOT — Bid Submission Checklist',
      'DOA — 3-Airport Document Tracker',
      'ADS-B Installation Checklist — CATM Ground Station & Vehicle Terminal',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Built-in')).toHaveLength(4)
  })

  it('"New Template" navigates to the editor', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    const user = userEvent.setup()
    renderList()
    await user.click(screen.getByRole('button', { name: 'New Template' }))
    expect(await screen.findByText('New template editor')).toBeInTheDocument()
  })

  it('disables Delete for a built-in template', () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    renderList()
    const marRow = screen.getByText('MAR — Vendor Approval Checklist').closest('tr')!
    const deleteButton = marRow.querySelector('button[aria-label^="Delete "]')
    expect(deleteButton).toBeDisabled()
  })

  it('duplicates a template and navigates to the copy', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    const user = userEvent.setup()
    renderList()
    await user.click(screen.getByRole('button', { name: 'Duplicate MAR — Vendor Approval Checklist' }))
    expect(await screen.findByText('Template editor')).toBeInTheDocument()
    const copy = useTemplateStore.getState().templates.find((t) => t.label === 'MAR — Vendor Approval Checklist (Copy)')
    expect(copy).toBeDefined()
    expect(copy!.isBuiltin).toBe(false)
  })

  it('deletes a custom template not in use by any project', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    await useTemplateStore.getState().createTemplate({
      label: 'Deletable Custom',
      description: 'd',
      tabSet: 'single',
      hasDetailSheets: false,
      hasGroups: false,
      hasPriority: false,
      supportsDefaultPhase: false,
      groups: [],
      priorities: [],
      items: [],
      sheets: [],
    })

    const user = userEvent.setup()
    renderList()
    expect(screen.getByText('Deletable Custom')).toBeInTheDocument()

    const row = screen.getByText('Deletable Custom').closest('tr')!
    await user.click(row.querySelector('button[aria-label="Delete Deletable Custom"]')!)
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.queryByText('Deletable Custom')).not.toBeInTheDocument()
    expect(useTemplateStore.getState().templates.find((t) => t.label === 'Deletable Custom')).toBeUndefined()
  })
})
