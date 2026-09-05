import { describe, expect, it } from 'vitest'
import { formatThaiDate } from './thaiDate'

describe('formatThaiDate', () => {
  it('converts to Buddhist era with the Thai month name', () => {
    expect(formatThaiDate('2026-09-05')).toBe('5 กันยายน 2569')
  })

  it('handles a different month/year', () => {
    expect(formatThaiDate('2024-01-01')).toBe('1 มกราคม 2567')
  })

  it('falls back to the raw string for unparseable input', () => {
    expect(formatThaiDate('not-a-date')).toBe('not-a-date')
  })
})
