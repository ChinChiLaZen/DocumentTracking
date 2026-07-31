import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PhaseDashboardPage } from './PhaseDashboardPage'
import { UTAPAO_PROJECT_ID } from '../../data/initialProjects'

vi.mock('@clerk/react', () => ({
  useUser: () => ({
    isLoaded: true,
    user: { primaryEmailAddress: { emailAddress: 'reviewer@example.com' } },
  }),
}))

function renderPage() {
  render(
    <MemoryRouter initialEntries={[`/projects/${UTAPAO_PROJECT_ID}`]}>
      <Routes>
        <Route path="/projects/:projectId" element={<PhaseDashboardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PhaseDashboardPage', () => {
  it(
    'renders the 7 real phase cards plus Unassigned, with every item defaulting to After Contract',
    () => {
      renderPage()
      expect(screen.getByRole('heading', { name: 'Phase Progress' })).toBeInTheDocument()
      // TEMPLATE_ITEMS defaults every item's phase to 'AfterContract' (real,
      // confirmed data — the MAR checklist is inherently a post-contract-award
      // submittal process), so only Pre-Bidding/Bidding/Installation &
      // Commissioning/Warranty/Operation & Maintenance/Others read 0/0, and
      // "Unassigned" only appears once (the card — its table section doesn't
      // render since no items are unassigned).
      for (const label of [
        'Pre-Bidding',
        'Bidding',
        'Installation & Commissioning',
        'Warranty',
        'Operation & Maintenance',
        'Others',
      ]) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
      // "After Contract" appears many times — the card label, the table's
      // section header, and each of the 28 rows' selected Phase dropdown value.
      expect(screen.getAllByText('After Contract').length).toBeGreaterThan(2)
      expect(screen.getByText('Unassigned')).toBeInTheDocument()
      expect(screen.getByText(/0 of 28 items submitted \(0%\)/)).toBeInTheDocument()
    },
    15000, // rendering 28 rows x 2 Radix Selects each is legitimately slow in jsdom
  )

  it('opens the History dialog to an empty state', async () => {
    renderPage()
    await userEvent.setup().click(screen.getByRole('button', { name: 'View History' }))
    expect(screen.getByRole('dialog', { name: 'Status change history' })).toBeInTheDocument()
    expect(screen.getByText('No history yet.')).toBeInTheDocument()
  })
})
