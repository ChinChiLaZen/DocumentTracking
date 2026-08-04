import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectsListPage } from './ProjectsListPage'
import { DEMO_PROJECT_ID, INITIAL_PROJECTS, UTAPAO_PROJECT_ID } from '../../data/initialProjects'
import { useTrackerStore } from '../../store/useTrackerStore'
import { useAuthStore } from '../../store/useAuthStore'

afterEach(() => {
  useAuthStore.setState({ user: null })
})

describe('ProjectsListPage', () => {
  it('lists every initial project with its title/vendor/scope and a link into it', () => {
    render(
      <MemoryRouter>
        <ProjectsListPage />
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
        <ProjectsListPage />
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
        <ProjectsListPage />
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
        <ProjectsListPage />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: new RegExp('DOA Summary Card Test') })
    expect(link).toHaveTextContent('0 of 64 items submitted (0%)')
  })

  it('opens the Add Project dialog for an admin', async () => {
    useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
    const { default: userEvent } = await import('@testing-library/user-event')
    render(
      <MemoryRouter>
        <ProjectsListPage />
      </MemoryRouter>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add Project' }))
    expect(screen.getByRole('dialog', { name: 'Add a new project' })).toBeInTheDocument()
  })

  describe('role-gated Add/Edit/Delete', () => {
    it('hides Add Project, Edit and Delete for a plain member', () => {
      useAuthStore.setState({ user: { email: 'member@example.com', role: 'member' } })
      render(
        <MemoryRouter>
          <ProjectsListPage />
        </MemoryRouter>,
      )
      expect(screen.queryByRole('button', { name: 'Add Project' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Edit /i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Delete /i })).not.toBeInTheDocument()
    })

    it('shows Add Project and Edit, but not Delete, for a Project Manager', () => {
      useAuthStore.setState({ user: { email: 'pm@example.com', role: 'ProjectManager' } })
      render(
        <MemoryRouter>
          <ProjectsListPage />
        </MemoryRouter>,
      )
      expect(screen.getByRole('button', { name: 'Add Project' })).toBeInTheDocument()
      const projectCount = useTrackerStore.getState().projectOrder.length
      expect(screen.getAllByRole('button', { name: /^Edit /i }).length).toBe(projectCount)
      expect(screen.queryByRole('button', { name: /^Delete /i })).not.toBeInTheDocument()
    })

    it('shows Add Project, Edit, and Delete for an admin', () => {
      useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
      render(
        <MemoryRouter>
          <ProjectsListPage />
        </MemoryRouter>,
      )
      expect(screen.getByRole('button', { name: 'Add Project' })).toBeInTheDocument()
      const projectCount = useTrackerStore.getState().projectOrder.length
      expect(screen.getAllByRole('button', { name: /^Edit /i }).length).toBe(projectCount)
      expect(screen.getAllByRole('button', { name: /^Delete /i }).length).toBe(projectCount)
    })
  })

  describe('EditProjectDialog', () => {
    it(
      'saves a title/vendor/scope change and reflects it immediately on the card',
      async () => {
        useAuthStore.setState({ user: { email: 'admin@example.com', role: 'admin' } })
        const { default: userEvent } = await import('@testing-library/user-event')
        const user = userEvent.setup()
        render(
          <MemoryRouter>
            <ProjectsListPage />
          </MemoryRouter>,
        )

        await user.click(screen.getByRole('button', { name: `Edit ${INITIAL_PROJECTS[1].meta.title}` }))
        const titleInput = screen.getByLabelText('Project title')
        await user.clear(titleInput)
        await user.type(titleInput, 'Renamed Demo Project')
        await user.click(screen.getByRole('button', { name: 'Save changes' }))

        expect(screen.getByText('Renamed Demo Project')).toBeInTheDocument()
        expect(useTrackerStore.getState().projects[DEMO_PROJECT_ID].meta.title).toBe('Renamed Demo Project')
      },
      10000,
    )
  })
})
