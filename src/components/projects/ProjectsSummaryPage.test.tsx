import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectsSummaryPage } from './ProjectsSummaryPage'

describe('ProjectsSummaryPage', () => {
  it('renders the cross-project stat cards', () => {
    render(
      <MemoryRouter>
        <ProjectsSummaryPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Total Items')).toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Overall Progress')).toBeInTheDocument()
  })
})
