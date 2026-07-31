import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TrackerTable } from './TrackerTable'
import { selectItemsWithStatus } from '../../store/selectors'
import { INITIAL_PROJECTS, UTAPAO_PROJECT_ID } from '../../data/initialProjects'

const { items, sheets } = INITIAL_PROJECTS.find((p) => p.meta.id === UTAPAO_PROJECT_ID)!
const basePath = `/projects/${UTAPAO_PROJECT_ID}`

describe('TrackerTable', () => {
  it('renders all 28 rows grouped G1 through G5 in order', () => {
    const rows = selectItemsWithStatus({ items, sheets })
    render(
      <MemoryRouter>
        <TrackerTable items={rows} basePath={basePath} />
      </MemoryRouter>,
    )

    for (let no = 1; no <= 28; no++) {
      expect(screen.getByText(String(no))).toBeInTheDocument()
    }

    const groupHeadings = screen.getAllByText(/^Group \d/)
    expect(groupHeadings.map((el) => el.textContent)).toEqual([
      expect.stringContaining('Group 1'),
      expect.stringContaining('Group 2'),
      expect.stringContaining('Group 3'),
      expect.stringContaining('Group 4'),
      expect.stringContaining('Group 5'),
    ])
  })

  it('shows a MANUAL flag when an item has a reviewer override', () => {
    const rows = selectItemsWithStatus({ items, sheets }).map((item) =>
      item.no === 13
        ? { ...item, manualStatus: 'Needs Revision' as const, status: 'Needs Revision' as const }
        : item,
    )
    render(
      <MemoryRouter>
        <TrackerTable items={rows} basePath={basePath} />
      </MemoryRouter>,
    )
    expect(screen.getByText('MANUAL')).toBeInTheDocument()
  })

  it('links sheet-backed items to their detail sheet with the right item param', () => {
    const rows = selectItemsWithStatus({ items, sheets })
    render(
      <MemoryRouter>
        <TrackerTable items={rows} basePath={basePath} />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', {
      name: 'Technical Datasheet / Product Catalogs — All Fixture Types',
    })
    expect(link).toHaveAttribute('href', `${basePath}/items?item=1`)
  })
})
