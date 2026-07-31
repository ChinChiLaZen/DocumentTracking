import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PriorityPage } from './PriorityPage'
import { UTAPAO_PROJECT_ID } from '../../data/initialProjects'

function rowNumberCells() {
  // Row numbers render in the first column of each item row; group header
  // rows and the page heading don't match a bare integer text node.
  return screen.getAllByRole('cell').filter((cell) => /^\d+$/.test(cell.textContent ?? ''))
}

function renderPriority(priority: 'A' | 'B' | 'C') {
  render(
    <MemoryRouter initialEntries={[`/projects/${UTAPAO_PROJECT_ID}`]}>
      <Routes>
        <Route path="/projects/:projectId" element={<PriorityPage priority={priority} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PriorityPage', () => {
  it('shows exactly 11 rows for Priority A', () => {
    renderPriority('A')
    expect(rowNumberCells()).toHaveLength(11)
  })

  it('shows exactly 14 rows for Priority B', () => {
    renderPriority('B')
    expect(rowNumberCells()).toHaveLength(14)
  })

  it('shows exactly 3 rows for Priority C', () => {
    renderPriority('C')
    expect(rowNumberCells()).toHaveLength(3)
  })
})
