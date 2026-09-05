// Thai baht-text ("BAHTTEXT") converter — spells out a number as its
// Thai-language baht/satang reading, matching the standard algorithm used by
// Excel's Thai-locale BAHTTEXT() function and Thai government documents.
// Pure, no external dependencies.

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
// Index = place-from-right within a 6-digit group. Places 0 (units) and 1
// (tens) are handled separately below for their irregulars; only 2..5 use
// this lookup (ร้อย/พัน/หมื่น/แสน).
const PLACE_NAMES = ['', '', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

/** Converts one 1-6-digit chunk (most-significant digit first, no leading
 *  zeros) to Thai text, applying the three standard irregulars:
 *  - a tens digit of 1 is silent ("สิบ" not "หนึ่งสิบ")
 *  - a tens digit of 2 reads "ยี่สิบ" not "สองสิบ"
 *  - a units digit of 1 reads "เอ็ด" (not "หนึ่ง") whenever this chunk has
 *    more than one digit (i.e. is not simply the number "1" on its own).
 */
function chunkText(digits: number[]): string {
  const n = digits.length
  let text = ''
  digits.forEach((digit, i) => {
    if (digit === 0) return
    const place = n - i - 1 // 0 = units, 1 = tens, 2 = hundreds, ...
    if (place === 0) {
      text += digit === 1 && n > 1 ? 'เอ็ด' : THAI_DIGITS[digit]
    } else if (place === 1) {
      if (digit === 1) text += 'สิบ'
      else if (digit === 2) text += 'ยี่สิบ'
      else text += THAI_DIGITS[digit] + 'สิบ'
    } else {
      text += THAI_DIGITS[digit] + PLACE_NAMES[place]
    }
  })
  return text
}

function stripLeadingZeros(digits: number[]): number[] {
  const i = digits.findIndex((d) => d !== 0)
  return i === -1 ? [0] : digits.slice(i)
}

/** Converts a non-negative integer to Thai text (no "บาท"/"สตางค์" suffix —
 *  see `bahtText` for the full currency reading). Splits into 6-digit groups
 *  from the right; each group further left is suffixed with one "ล้าน" per
 *  level (so a group two levels up reads "...ล้านล้าน"). The one documented
 *  cross-group irregular: when the very last digit of the WHOLE number is 1
 *  and the number has more than one significant digit overall, it reads
 *  "เอ็ด" even though its own 6-digit group in isolation is just "1" (e.g.
 *  1,000,001 -> "หนึ่งล้านเอ็ด", not "หนึ่งล้านหนึ่ง"). */
function integerText(value: number): string {
  if (value === 0) return THAI_DIGITS[0]
  const digitStr = String(Math.trunc(value))
  const groups: number[][] = []
  for (let end = digitStr.length; end > 0; end -= 6) {
    const start = Math.max(0, end - 6)
    groups.push(digitStr.slice(start, end).split('').map(Number))
  }
  // groups[0] = rightmost (units) group, groups[1] = millions group, etc.
  const hasHigherNonzero = groups.slice(1).some((g) => g.some((d) => d !== 0))
  let result = ''
  for (let level = groups.length - 1; level >= 0; level--) {
    const stripped = stripLeadingZeros(groups[level])
    if (stripped.length === 1 && stripped[0] === 0) continue // whole group is zero — skip, no "ล้าน" either
    if (level === 0 && stripped.length === 1 && stripped[0] === 1 && hasHigherNonzero) {
      result += 'เอ็ด'
    } else {
      result += chunkText(stripped)
    }
    if (level > 0) result += 'ล้าน'.repeat(level)
  }
  return result
}

/** Spells out `amount` (baht, may include satang as a decimal fraction) as
 *  Thai currency text, e.g. `bahtText(100)` -> 'หนึ่งร้อยบาทถ้วน'. Ground-truth
 *  example locked in by the colocated test: `bahtText(64999169.09)` ->
 *  'หกสิบสี่ล้านเก้าแสนเก้าหมื่นเก้าพันหนึ่งร้อยหกสิบเก้าบาทเก้าสตางค์'. */
export function bahtText(amount: number): string {
  const totalSatangUnits = Math.round(Math.abs(amount) * 100)
  const baht = Math.floor(totalSatangUnits / 100)
  const satang = totalSatangUnits % 100
  const sign = amount < 0 ? 'ลบ' : ''
  const bahtPart = `${integerText(baht)}บาท`
  const satangPart = satang === 0 ? 'ถ้วน' : `${integerText(satang)}สตางค์`
  return `${sign}${bahtPart}${satangPart}`
}
