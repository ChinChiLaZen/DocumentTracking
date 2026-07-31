import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { UTAPAO_PROJECT_ID } from '../../data/initialProjects'

describe('DashboardPage', () => {
  it('shows the seeded totals: 28 items, 120/282 checkbox roll-up, integrity OK', () => {
    render(
      <MemoryRouter initialEntries={[`/projects/${UTAPAO_PROJECT_ID}`]}>
        <Routes>
          <Route path="/projects/:projectId" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText(/Checkbox Roll-up — 120 of 282/)).toBeInTheDocument()
    expect(screen.getByText(/Data integrity check passed/)).toBeInTheDocument()
  })
})
