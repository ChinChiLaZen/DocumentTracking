import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckboxTable } from './CheckboxTable'
import type { DetailSheet } from '../../data/types'

function fixtureSheet(): DetailSheet {
  return {
    id: 'fixture',
    itemNo: 999,
    title: 'Fixture Sheet',
    applicable: 'n/a',
    columns: [
      { key: 'foo', label: 'Foo Column' },
      { key: 'bar', label: 'Bar Column' },
    ],
    rows: [{ id: 'r1', description: 'Row 1', cells: { foo: true, bar: false } }],
  }
}

describe('CheckboxTable', () => {
  it('renders headers generically from sheet.columns, never Item 1 specific labels', () => {
    render(
      <CheckboxTable
        sheet={fixtureSheet()}
        selectedRowIds={new Set()}
        onToggleCell={vi.fn()}
        onToggleRowSelection={vi.fn()}
      />,
    )
    expect(screen.getByText('Foo Column')).toBeInTheDocument()
    expect(screen.getByText('Bar Column')).toBeInTheDocument()
    expect(screen.queryByText('Model No. / Ordering Ref.')).not.toBeInTheDocument()
  })

  it('gives every checkbox an aria-label composed of sheet, row, and column', () => {
    render(
      <CheckboxTable
        sheet={fixtureSheet()}
        selectedRowIds={new Set()}
        onToggleCell={vi.fn()}
        onToggleRowSelection={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Fixture Sheet — Row 1 — Foo Column')).toBeInTheDocument()
  })
})
