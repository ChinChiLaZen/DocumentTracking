const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

/** Formats an ISO yyyy-mm-dd date as a Thai-language, Buddhist-era long date
 *  (e.g. "5 กันยายน 2569" for 2026-09-05 — Buddhist year = Gregorian + 543).
 *  Written as a plain string rather than an Excel numFmt-driven date cell so
 *  it renders correctly regardless of the opening machine's locale (see the
 *  BOQ export plan's Buddhist-era-date decision). Falls back to the raw ISO
 *  string if it doesn't parse, rather than throwing on unexpected input. */
export function formatThaiDate(iso: string): string {
  const [yearStr, monthStr, dayStr] = iso.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!year || !month || !day || month < 1 || month > 12) return iso
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`
}
