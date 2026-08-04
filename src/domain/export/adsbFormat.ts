import type { AdsbEmployerResult, AdsbHwPoint, AdsbResult } from '../../data/types'

/**
 * Shared visual language for the ADS-B Excel/Word exports, lifted from the
 * reference templates in masterfile/ADS-B_Installation_* (TH Sarabun New,
 * navy/grey palette, thin #AAB4BC borders) — matched here so the exported
 * files read as the same document family as those references.
 */
export const ADSB_FONT = 'TH Sarabun New'

export const ADSB_COLORS = {
  navy: 'FF1F3B57',
  grey: 'FF555555',
  dark: 'FF1A1A1A',
  border: 'FFAAB4BC',
  metaLabelBg: 'FFEEF3F7',
  headerBg: 'FF1F3B57',
  headerText: 'FFFFFFFF',
  phaseDividerBg: 'FFF0F0F0',
  rowBandA: 'FFFFFFFF',
  rowBandB: 'FFF4F7F2',
  pass: 'FF15803D',
  fail: 'FFB23A2E',
  na: 'FFB9770E',
} as const

export const ADSB_RESULT_TH: Record<AdsbResult, string> = {
  Pass: 'ผ่าน',
  Fail: 'ไม่ผ่าน',
  NotApplicable: 'N/A',
}

export const ADSB_EMPLOYER_RESULT_TH: Record<AdsbEmployerResult, string> = {
  Accepted: 'ยอมรับ',
  Conditional: 'มีเงื่อนไข',
  Rejected: 'ไม่ยอมรับ',
}

export const ADSB_HW_TH: Record<AdsbHwPoint, string> = {
  Hold: 'H',
  Witness: 'W',
}

export const ADSB_LEGEND =
  'คำอธิบาย / Legend:  ผู้รับผิดชอบ (Resp.): E=ผู้ว่าจ้าง, C=ผู้รับจ้าง, S=ผู้ผลิต-ผู้จำหน่าย.   จุดตรวจ (H/W): H=Hold Point, W=Witness Point.   อ้างอิง TOR = เลขข้อในตารางผนวก ข.'

export const ADSB_META_FIELDS: [string, string][] = [
  ['ชื่อสนามบิน/สถานี Airport/Station', 'วันที่ตรวจสอบ Date'],
  ['ผู้ตรวจสอบ Inspector', 'เลขที่ยานพาหนะ/ทะเบียน Vehicle no./Plate'],
  ['เลขที่เอกสาร Document no.', 'ฉบับแก้ไข/วันที่ Rev./Date'],
]

export const ADSB_CONTRACTOR_TITLE = 'แบบตรวจสอบและบันทึกการติดตั้ง (สำหรับผู้รับจ้าง)'
export const ADSB_CONTRACTOR_SUBTITLE = 'Installation Check & Record Sheet — for Contractor'
export const ADSB_EMPLOYER_TITLE = 'แบบตรวจรับงานติดตั้ง (สำหรับฝ่ายผู้ว่าจ้าง)'
export const ADSB_EMPLOYER_SUBTITLE = 'Installation Acceptance Record (ITP) — for Employer'
