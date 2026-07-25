import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PriorityPage } from './PriorityPage'

function rowNumberCells() {
  // Row numbers render in the first column of each item row; group header
  // rows and the page heading don't match a bare integer text node.
  return screen.getAllByRole('cell').filter((cell) => /^\d+$/.test(cell.textContent ?? ''))
}

describe('PriorityPage', () => {
  it('shows exactly 11 rows for Priority A', () => {
    render(
      <MemoryRouter>
        <PriorityPage priority="A" />
      </MemoryRouter>,
    )
    expect(rowNumberCells()).toHaveLength(11)
  })

  it('shows exactly 14 rows for Priority B', () => {
    render(
      <MemoryRouter>
        <PriorityPage priority="B" />
      </MemoryRouter>,
    )
    expect(rowNumberCells()).toHaveLength(14)
  })

  it('shows exactly 3 rows for Priority C', () => {
    render(
      <MemoryRouter>
        <PriorityPage priority="C" />
      </MemoryRouter>,
    )
    expect(rowNumberCells()).toHaveLength(3)
  })
})
