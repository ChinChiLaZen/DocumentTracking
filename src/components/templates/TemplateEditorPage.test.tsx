import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

// Replaces the singleton useTemplateStore (normally backed by real
// createApiPersistence(), which would try a real network fetch in jsdom)
// with one backed by the in-memory persistence adapter — same technique
// useTrackerStore.test.ts uses via createTrackerStore(createMemoryPersistence()),
// just applied at the module-mock boundary since these components consume
// the exported singleton directly rather than accepting an injected store.
vi.mock('../../store/useTemplateStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/useTemplateStore')>()
  const { createMemoryPersistence } = await import('../../store/persistence')
  return { ...actual, useTemplateStore: actual.createTemplateStore(createMemoryPersistence()) }
})

const { TemplateEditorPage } = await import('./TemplateEditorPage')
const { useTemplateStore } = await import('../../store/useTemplateStore')

function renderEditor(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/templates" element={<div>Templates list</div>} />
        <Route path="/templates/:templateId" element={<TemplateEditorPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  useAuthStore.setState({ user: null })
})

describe('TemplateEditorPage', () => {
  it('redirects a non-admin to /', () => {
    useAuthStore.setState({ user: { email: 'member@example.com', role: 'member' } })
    renderEditor('/templates/new')
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('redirects to /templates for an unknown template id', () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    renderEditor('/templates/no-such-id')
    expect(screen.getByText('Templates list')).toBeInTheDocument()
  })

  it('builds a brand-new flat template with an item, saves it, and it appears in the registry', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    const user = userEvent.setup()
    renderEditor('/templates/new')

    await user.type(screen.getByLabelText('Label'), 'My Flat Template')
    await user.type(screen.getByLabelText('Description'), 'A description')

    await user.click(screen.getByRole('tab', { name: 'Items' }))
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    await user.type(screen.getByLabelText('Item 1 name'), 'First item')
    await user.type(screen.getByLabelText('Item 1 standard'), 'Some standard')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Templates list')).toBeInTheDocument()
    const created = useTemplateStore.getState().templates.find((t) => t.label === 'My Flat Template')
    expect(created).toBeDefined()
    expect(created!.isBuiltin).toBe(false)
    expect(created!.items).toHaveLength(1)
    expect(created!.items[0]).toMatchObject({ no: 1, name: 'First item', standard: 'Some standard' })
  })

  it('linking an item to a detail sheet sets sheet.itemNo — the actual runtime link (detailSheetId is presence-only)', async () => {
    // Regression test: ItemDetailsPage.tsx/selectors.ts/excelExport.ts/
    // wordExport.ts all look a sheet up via `sheet.itemNo === item.no`, never
    // by dereferencing `item.detailSheetId` against `sheet.id` (that field is
    // only ever checked for presence). Picking a sheet in the Items tab must
    // therefore also stamp the sheet's itemNo, or the link silently does
    // nothing at render time even though the picker looks "connected".
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    const user = userEvent.setup()
    renderEditor('/templates/new')

    await user.type(screen.getByLabelText('Label'), 'Linked Sheet Template')
    await user.type(screen.getByLabelText('Description'), 'Checks the item-sheet link')
    await user.click(screen.getByLabelText('Items can have a checkbox detail sheet'))

    await user.click(screen.getByRole('tab', { name: 'Detail sheets' }))
    await user.click(screen.getByRole('button', { name: 'Add sheet' }))

    await user.click(screen.getByRole('tab', { name: 'Items' }))
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    await user.type(screen.getByLabelText('Item 1 name'), 'Linked item')

    await user.click(screen.getByLabelText('Item 1 detail sheet'))
    await user.click(await screen.findByRole('option', { name: 'New sheet' }))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    const created = useTemplateStore.getState().templates.find((t) => t.label === 'Linked Sheet Template')!
    expect(created.items[0].detailSheetId).toBe(created.sheets[0].id)
    expect(created.sheets[0].itemNo).toBe(created.items[0].no)
  })

  it('builds a detail-sheet template: adding a column gives every row a fresh cell, removing one drops it', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    const user = userEvent.setup()
    renderEditor('/templates/new')

    await user.type(screen.getByLabelText('Label'), 'Sheet Template')
    await user.type(screen.getByLabelText('Description'), 'Has a checkbox sheet')
    await user.click(screen.getByLabelText('Items can have a checkbox detail sheet'))

    await user.click(screen.getByRole('tab', { name: 'Detail sheets' }))
    await user.click(screen.getByRole('button', { name: 'Add sheet' }))
    await user.click(screen.getByRole('button', { name: 'Add column' }))
    await user.click(screen.getByRole('button', { name: 'Add row' }))

    // One column exists — exactly one checkbox cell on the one row.
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    await user.click(screen.getByRole('checkbox'))

    // Adding a second column gives the existing row a second (unchecked) cell.
    await user.click(screen.getByRole('button', { name: 'Add column' }))
    const checkboxesAfterAdd = screen.getAllByRole('checkbox')
    expect(checkboxesAfterAdd).toHaveLength(2)
    expect(checkboxesAfterAdd[0]).toBeChecked() // untouched
    expect(checkboxesAfterAdd[1]).not.toBeChecked() // fresh column, defaults false

    // Removing the first column's row drops that column's cell entirely,
    // leaving only the second column's (still-false) checkbox.
    await user.click(screen.getAllByRole('button', { name: 'Remove column' })[0])
    const checkboxesAfterRemove = screen.getAllByRole('checkbox')
    expect(checkboxesAfterRemove).toHaveLength(1)
    expect(checkboxesAfterRemove[0]).not.toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    const created = useTemplateStore.getState().templates.find((t) => t.label === 'Sheet Template')!
    expect(created.sheets).toHaveLength(1)
    expect(created.sheets[0].columns).toHaveLength(1)
    expect(Object.keys(created.sheets[0].rows[0].cells)).toEqual([created.sheets[0].columns[0].key])
    expect(created.sheets[0].rows[0].cells[created.sheets[0].columns[0].key]).toBe(false)
  })

  it('editing a built-in (mar) and saving creates a live override, and "Reset to shipped default" only then appears', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    const user = userEvent.setup()
    renderEditor('/templates/mar')

    expect(screen.queryByRole('button', { name: 'Reset to shipped default' })).not.toBeInTheDocument()

    const labelInput = screen.getByLabelText('Label')
    await user.clear(labelInput)
    await user.type(labelInput, 'Reconfigured MAR')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Templates list')).toBeInTheDocument()
    expect(useTemplateStore.getState().templates.find((t) => t.id === 'mar')!.label).toBe('Reconfigured MAR')

    renderEditor('/templates/mar')
    expect(await screen.findByRole('button', { name: 'Reset to shipped default' })).toBeInTheDocument()
  })

  it('"Reset to shipped default" reverts an override back to the built-in label', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    await useTemplateStore.getState().updateTemplate('mar', {
      ...useTemplateStore.getState().templates.find((t) => t.id === 'mar')!,
      label: 'Temporarily Reconfigured',
    })

    const user = userEvent.setup()
    renderEditor('/templates/mar')
    await user.click(await screen.findByRole('button', { name: 'Reset to shipped default' }))

    expect(await screen.findByText('Templates list')).toBeInTheDocument()
    expect(useTemplateStore.getState().templates.find((t) => t.id === 'mar')!.label).toBe(
      'MAR — Vendor Approval Checklist',
    )
  })
})
