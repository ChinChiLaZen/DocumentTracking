import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdsbChecklistPage } from './AdsbChecklistPage'
import { useTrackerStore } from '../../store/useTrackerStore'

function renderPage() {
  const id = useTrackerStore.getState().createProject({
    title: 'ADS-B Test Project',
    vendor: '',
    scope: '',
    preparedDate: '2026-08-03',
    templateKind: 'adsb',
  })
  render(
    <MemoryRouter initialEntries={[`/projects/${id}`]}>
      <Routes>
        <Route path="/projects/:projectId" element={<AdsbChecklistPage />} />
      </Routes>
    </MemoryRouter>,
  )
  return id
}

describe(
  'AdsbChecklistPage',
  () => {
    it('renders the Contractor tab by default with all 96 items pending', () => {
      renderPage()
      expect(screen.getByText('0/96 reviewed')).toBeInTheDocument()
      expect(screen.getByText('A1')).toBeInTheDocument()
      // A10 is Contractor-only (employerIncluded: false in the real data) — still shown here.
      expect(screen.getByText('A10')).toBeInTheDocument()
    })

    it('clicking Pass stages the change until Save changes is clicked', async () => {
      renderPage()
      const user = userEvent.setup()
      const a1Card = screen.getByText('A1').closest('[data-slot="card"]') as HTMLElement
      await user.click(within(a1Card).getByRole('button', { name: 'ผ่าน / Pass' }))
      // Staged, not yet persisted — the stat count doesn't move until Save.
      expect(screen.getByText('0/96 reviewed')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Save changes (1)' }))
      expect(screen.getByText('1/96 reviewed')).toBeInTheDocument()
    })

    it('Discard reverts a staged Pass click', async () => {
      renderPage()
      const user = userEvent.setup()
      const a1Card = screen.getByText('A1').closest('[data-slot="card"]') as HTMLElement
      await user.click(within(a1Card).getByRole('button', { name: 'ผ่าน / Pass' }))
      await user.click(screen.getByRole('button', { name: 'Discard' }))
      expect(screen.getByText('0/96 reviewed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    })

    it('Employer tab scopes to the 80 employerIncluded items only', async () => {
      renderPage()
      const user = userEvent.setup()
      await user.click(screen.getByRole('tab', { name: 'ผู้ว่าจ้าง / Employer' }))
      expect(screen.getByText('0/80 reviewed')).toBeInTheDocument()
      expect(screen.getByText('A1')).toBeInTheDocument()
      // A10 has employerIncluded: false — must not appear under Employer.
      expect(screen.queryByText('A10')).not.toBeInTheDocument()
    })

    it('search narrows results to matching items', async () => {
      renderPage()
      const user = userEvent.setup()
      await user.type(
        screen.getByPlaceholderText('Search items, IDs, or responsibility...'),
        'antenna type',
      )
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.queryByText('A10')).not.toBeInTheDocument()
    })
  },
  20000,
)
