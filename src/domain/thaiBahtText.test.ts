import { describe, expect, it } from 'vitest'
import { bahtText } from './thaiBahtText'

describe('bahtText', () => {
  it('matches the real BOQ template ground-truth example (64,999,169.09)', () => {
    expect(bahtText(64999169.09)).toBe(
      'หกสิบสี่ล้านเก้าแสนเก้าหมื่นเก้าพันหนึ่งร้อยหกสิบเก้าบาทเก้าสตางค์',
    )
  })

  it('reads zero as ศูนย์บาทถ้วน', () => {
    expect(bahtText(0)).toBe('ศูนย์บาทถ้วน')
  })

  it('appends ถ้วน (exactly/even) whenever satang is 0', () => {
    expect(bahtText(100)).toBe('หนึ่งร้อยบาทถ้วน')
  })

  it('reads a silent tens-1 as "สิบ" and a units-1 as "เอ็ด" (11 -> สิบเอ็ด)', () => {
    expect(bahtText(11)).toBe('สิบเอ็ดบาทถ้วน')
  })

  it('reads a tens-2 as "ยี่สิบ" combined with the "เอ็ด" units irregular (21 -> ยี่สิบเอ็ด)', () => {
    expect(bahtText(21)).toBe('ยี่สิบเอ็ดบาทถ้วน')
  })

  it('applies the units-1 "เอ็ด" irregular across a million-group boundary', () => {
    expect(bahtText(1000001)).toBe('หนึ่งล้านเอ็ดบาทถ้วน')
  })
})
