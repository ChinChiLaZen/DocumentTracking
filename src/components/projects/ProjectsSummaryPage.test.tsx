import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectsSummaryPage } from './ProjectsSummaryPage'
import { DEMO_PROJECT_ID, INITIAL_PROJECTS, UTAPAO_PROJECT_ID } from '../../data/initialProjects'
import { useTrackerStore } from '../../store/useTrackerStore'

// This page renders outside any ClerkProvider in these unit tests; stub the
// one Clerk component it uses so we're testing project-listing behavior, not auth wiring.
vi.mock('@clerk/react', () => ({ UserButton: () => null }))

describe('ProjectsSummaryPage', () => {
  it('lists every initial project with its title/vendor/scope and a link into it', () => {
    render(
      <MemoryRouter>
        <ProjectsSummaryPage />
      </MemoryRouter>,
    )

    for (const { meta } of INITIAL_PROJECTS) {
      expect(screen.getByText(meta.title)).toBeInTheDocument()
      const link = screen.getByRole('link', { name: new RegExp(meta.title) })
      expect(link).toHaveAttribute('href', `/projects/${meta.id}`)
    }
  })

  it('renders an independent rollup snapshot per project', () => {
    render(
      <MemoryRouter>
        <ProjectsSummaryPage />
      </MemoryRouter>,
    )

    // Neither seeded project has any single item fully ticked yet (U-Tapao is
    // 120/282 across partially-ticked sheets; the demo project is blank) —
    // both should read 0 of 28 items submitted.
    const utapaoLink = screen.getByRole('link', { name: new RegExp('U-Tapao') })
    expect(utapaoLink).toHaveTextContent('0 of 28 items submitted (0%)')

    const demoLink = screen.getByRole('link', { name: new RegExp('Demo Project') })
    expect(demoLink).toHaveTextContent('0 of 28 items submitted (0%)')

    // Sanity-check the ids these two lookups are keyed on stay in sync with the seed.
    expect(INITIAL_PROJECTS.map((p) => p.meta.id)).toEqual([UTAPAO_PROJECT_ID, DEMO_PROJECT_ID])
  })

  it('renders an AOT project card without crashing (no Group/Priority on its items)', () => {
    const { createProject } = useTrackerStore.getState()
    createProject({
      title: 'AOT Summary Card Test',
      vendor: '',
      scope: '',
      preparedDate: '2026-08-01',
      templateKind: 'aot',
    })

    render(
      <MemoryRouter>
        <ProjectsSummaryPage />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: new RegExp('AOT Summary Card Test') })
    expect(link).toHaveTextContent('0 of 94 items submitted (0%)')
  })

  it('renders a DOA project card without crashing (no Group/Priority on its items)', () => {
    const { createProject } = useTrackerStore.getState()
    createProject({
      title: 'DOA Summary Card Test',
      vendor: '',
      scope: '',
      preparedDate: '2026-08-01',
      templateKind: 'doa',
    })

    render(
      <MemoryRouter>
        <ProjectsSummaryPage />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: new RegExp('DOA Summary Card Test') })
    expect(link).toHaveTextContent('0 of 64 items submitted (0%)')
  })

  it('opens the Add Project dialog', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    render(
      <MemoryRouter>
        <ProjectsSummaryPage />
      </MemoryRouter>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add Project' }))
    expect(screen.getByRole('dialog', { name: 'Add a new project' })).toBeInTheDocument()
  })
})
