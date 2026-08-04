import {
  AlignmentType,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import type { Item, ProjectMeta } from '../../data/types'
import { ADSB_INSTALL_PHASE_DEFS } from '../rules'
import {
  ADSB_COLORS,
  ADSB_CONTRACTOR_SUBTITLE,
  ADSB_CONTRACTOR_TITLE,
  ADSB_EMPLOYER_RESULT_TH,
  ADSB_EMPLOYER_SUBTITLE,
  ADSB_EMPLOYER_TITLE,
  ADSB_FONT,
  ADSB_HW_TH,
  ADSB_LEGEND,
  ADSB_META_FIELDS,
  ADSB_RESULT_TH,
} from './adsbFormat'
import { downloadBlob } from './download'
import { projectFileSlug } from './filename'

const BORDER = { style: 'single' as const, size: 4, color: ADSB_COLORS.border.slice(2) }
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }

function headerCell(text: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: ADSB_COLORS.headerBg.slice(2) },
    verticalAlign: VerticalAlign.CENTER,
    borders: CELL_BORDERS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: true,
            font: ADSB_FONT,
            size: 18,
            color: ADSB_COLORS.headerText.slice(2),
          }),
        ],
      }),
    ],
  })
}

function bodyCell(text: string, widthPct: number, band: boolean): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: (band ? ADSB_COLORS.rowBandB : ADSB_COLORS.rowBandA).slice(2) },
    verticalAlign: VerticalAlign.TOP,
    borders: CELL_BORDERS,
    children: [new Paragraph({ children: [new TextRun({ text, font: ADSB_FONT, size: 18 })] })],
  })
}

function phaseDividerRow(label: string, columnCount: number): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: columnCount,
        shading: { type: ShadingType.CLEAR, fill: ADSB_COLORS.phaseDividerBg.slice(2) },
        borders: CELL_BORDERS,
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: label, bold: true, font: ADSB_FONT, size: 18, color: ADSB_COLORS.navy.slice(2) }),
            ],
          }),
        ],
      }),
    ],
  })
}

function titleParagraph(text: string, opts: { size: number; bold?: boolean; italics?: boolean; color: string }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: opts.bold, italics: opts.italics, font: ADSB_FONT, size: opts.size, color: opts.color.slice(2) }),
    ],
  })
}

function metaFieldsTable(): Table {
  const rows = ADSB_META_FIELDS.map(
    ([left, right]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: ADSB_COLORS.metaLabelBg.slice(2) },
            borders: CELL_BORDERS,
            children: [new Paragraph({ children: [new TextRun({ text: left, bold: true, font: ADSB_FONT, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: CELL_BORDERS,
            children: [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: ADSB_COLORS.metaLabelBg.slice(2) },
            borders: CELL_BORDERS,
            children: [new Paragraph({ children: [new TextRun({ text: right, bold: true, font: ADSB_FONT, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: CELL_BORDERS,
            children: [new Paragraph('')],
          }),
        ],
      }),
  )
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

interface StatusCount {
  label: string
  count: number
  color: string
}

function summaryParagraph(total: number, statuses: StatusCount[]): Paragraph {
  const runs = [
    new TextRun({ text: 'สรุป / Summary:  ', bold: true, font: ADSB_FONT, size: 20, color: ADSB_COLORS.navy.slice(2) }),
    new TextRun({ text: `จำนวนรายการ Total ${total}   `, bold: true, font: ADSB_FONT, size: 20 }),
  ]
  for (const s of statuses) {
    runs.push(
      new TextRun({ text: `${s.label} ${s.count}   `, bold: true, font: ADSB_FONT, size: 20, color: s.color.slice(2) }),
    )
  }
  return new Paragraph({ children: runs })
}

interface RoleDocOptions {
  title: string
  subtitle: string
  meta: ProjectMeta
  items: Item[]
  columns: { header: string; widthPct: number }[]
  rowValues(item: Item): string[]
  statuses: StatusCount[]
}

function buildRoleDocument(opts: RoleDocOptions): Document {
  const sections = ADSB_INSTALL_PHASE_DEFS.map((def) => ({
    def,
    items: opts.items.filter((item) => item.installPhase === def.id),
  })).filter((s) => s.items.length > 0)

  const headerRow = new TableRow({
    tableHeader: true,
    children: opts.columns.map((c) => headerCell(c.header, c.widthPct)),
  })
  const rows: TableRow[] = [headerRow]
  let band = false
  for (const section of sections) {
    rows.push(phaseDividerRow(`${section.def.label} (${section.items.length})`, opts.columns.length))
    for (const item of section.items) {
      const values = opts.rowValues(item)
      rows.push(
        new TableRow({
          children: values.map((v, i) => bodyCell(v, opts.columns[i].widthPct, band)),
        }),
      )
      band = !band
    }
  }

  return new Document({
    styles: { default: { document: { run: { font: ADSB_FONT, size: 20 } } } },
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          titleParagraph(opts.title, { size: 32, bold: true, color: ADSB_COLORS.navy }),
          titleParagraph(opts.subtitle, { size: 24, bold: true, italics: true, color: ADSB_COLORS.grey }),
          titleParagraph(opts.meta.title, { size: 22, bold: true, color: ADSB_COLORS.dark }),
          titleParagraph(`${opts.meta.scope} — ${opts.meta.vendor}`, { size: 18, italics: true, color: ADSB_COLORS.grey }),
          new Paragraph(''),
          metaFieldsTable(),
          new Paragraph(''),
          new Paragraph({
            children: [new TextRun({ text: ADSB_LEGEND, italics: true, font: ADSB_FONT, size: 16, color: ADSB_COLORS.grey.slice(2) })],
          }),
          new Paragraph(''),
          summaryParagraph(
            opts.items.length,
            opts.statuses,
          ),
          new Paragraph(''),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
        ],
      },
    ],
  })
}

const CONTRACTOR_COLUMNS = [
  { header: 'ลำดับ\nNo.', widthPct: 5 },
  { header: 'รายการตรวจสอบ (ไทย)', widthPct: 15 },
  { header: 'Checklist item (EN)', widthPct: 15 },
  { header: 'ผู้รับผิดชอบ Resp.', widthPct: 6 },
  { header: 'อ้างอิงมาตรฐาน Std ref', widthPct: 8 },
  { header: 'อ้างอิง TOR', widthPct: 6 },
  { header: 'เกณฑ์ยอมรับ (ไทย)', widthPct: 13 },
  { header: 'Acceptance criteria (EN)', widthPct: 13 },
  { header: 'ค่าที่วัดได้ Measured', widthPct: 7 },
  { header: 'ผล Result', widthPct: 6 },
  { header: 'หมายเหตุ Remark', widthPct: 6 },
]

const EMPLOYER_COLUMNS = [
  { header: 'ลำดับ\nNo.', widthPct: 5 },
  { header: 'รายการตรวจรับ (ไทย)', widthPct: 14 },
  { header: 'Acceptance item (EN)', widthPct: 14 },
  { header: 'เกณฑ์ยอมรับ (ไทย)', widthPct: 12 },
  { header: 'Acceptance criteria (EN)', widthPct: 12 },
  { header: 'หลักฐาน (ไทย)', widthPct: 12 },
  { header: 'Required evidence (EN)', widthPct: 12 },
  { header: 'อ้างอิง TOR', widthPct: 6 },
  { header: 'จุดตรวจ H/W', widthPct: 5 },
  { header: 'ผลการตรวจรับ Result', widthPct: 6 },
  { header: 'หมายเหตุ Remark', widthPct: 6 },
]

function count(items: Item[], predicate: (item: Item) => boolean): number {
  return items.filter(predicate).length
}

export async function buildAdsbContractorDocxBlob(items: Item[], meta: ProjectMeta): Promise<Blob> {
  const doc = buildRoleDocument({
    title: ADSB_CONTRACTOR_TITLE,
    subtitle: ADSB_CONTRACTOR_SUBTITLE,
    meta,
    items,
    columns: CONTRACTOR_COLUMNS,
    statuses: [
      { label: ADSB_RESULT_TH.Pass, color: ADSB_COLORS.pass, count: count(items, (i) => i.result === 'Pass') },
      { label: ADSB_RESULT_TH.Fail, color: ADSB_COLORS.fail, count: count(items, (i) => i.result === 'Fail') },
      { label: ADSB_RESULT_TH.NotApplicable, color: ADSB_COLORS.na, count: count(items, (i) => i.result === 'NotApplicable') },
    ],
    rowValues: (item) => [
      item.code ?? String(item.no),
      item.nameTh ?? '',
      item.name,
      item.resp ?? '',
      item.standard,
      item.torRef ?? '',
      item.requirementTh ?? '',
      item.requirement,
      item.measured ?? '',
      item.result ? ADSB_RESULT_TH[item.result] : '',
      item.remark ?? '',
    ],
  })
  return Packer.toBlob(doc)
}

export async function buildAdsbEmployerDocxBlob(items: Item[], meta: ProjectMeta): Promise<Blob> {
  const scoped = items.filter((item) => item.employerIncluded)
  const doc = buildRoleDocument({
    title: ADSB_EMPLOYER_TITLE,
    subtitle: ADSB_EMPLOYER_SUBTITLE,
    meta,
    items: scoped,
    columns: EMPLOYER_COLUMNS,
    statuses: [
      { label: ADSB_EMPLOYER_RESULT_TH.Accepted, color: ADSB_COLORS.pass, count: count(scoped, (i) => i.employerResult === 'Accepted') },
      { label: ADSB_EMPLOYER_RESULT_TH.Conditional, color: ADSB_COLORS.na, count: count(scoped, (i) => i.employerResult === 'Conditional') },
      { label: ADSB_EMPLOYER_RESULT_TH.Rejected, color: ADSB_COLORS.fail, count: count(scoped, (i) => i.employerResult === 'Rejected') },
    ],
    rowValues: (item) => [
      item.code ?? String(item.no),
      item.nameTh ?? '',
      item.name,
      item.requirementTh ?? '',
      item.requirement,
      item.requiredEvidenceTh ?? '',
      item.requiredEvidence ?? '',
      item.torRef ?? '',
      item.hwPoint ? ADSB_HW_TH[item.hwPoint] : '',
      item.employerResult ? ADSB_EMPLOYER_RESULT_TH[item.employerResult] : '',
      item.employerRemark ?? '',
    ],
  })
  return Packer.toBlob(doc)
}

/**
 * Two separate downloads, not one `Promise.all`-then-both-at-once call — browsers
 * (Chrome in particular) silently block the second of two auto-triggered downloads
 * fired from a single click, so each file needs its own menu item / user gesture
 * (see ExportMenu.tsx's adsb-specific "Export Contractor" / "Export Employer" items).
 */
export async function exportAdsbContractorWord(items: Item[], meta: ProjectMeta): Promise<void> {
  const blob = await buildAdsbContractorDocxBlob(items, meta)
  downloadBlob(blob, `${projectFileSlug(meta)}-ADS-B-Installation-Checklist-Contractor.docx`)
}

export async function exportAdsbEmployerWord(items: Item[], meta: ProjectMeta): Promise<void> {
  const blob = await buildAdsbEmployerDocxBlob(items, meta)
  downloadBlob(blob, `${projectFileSlug(meta)}-ADS-B-Installation-Acceptance-Employer.docx`)
}
