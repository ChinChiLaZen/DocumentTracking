import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'

describe('DashboardPage', () => {
  it('shows the seeded totals: 28 items, 120/282 checkbox roll-up, integrity OK', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText(/Checkbox Roll-up — 120 of 282/)).toBeInTheDocument()
    expect(screen.getByText(/Data integrity check passed/)).toBeInTheDocument()
  })
})
