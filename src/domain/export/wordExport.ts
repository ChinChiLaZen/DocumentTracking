import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { DetailSheet, Item, ProjectMeta } from '../../data/types'
import { effectiveStatus, item3Remark } from '../derive'
import { GROUP_DEFS, LIFECYCLE_PHASE_DEFS } from '../rules'
import { DOA_SITE_LABEL } from '../../data/doaTemplate'
import { downloadBlob } from './download'
import { projectFileSlug } from './filename'

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
  })
}

function bodyCell(text: string): TableCell {
  return new TableCell({ children: [new Paragraph(text)] })
}

function makeTable(header: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: header.map(headerCell), tableHeader: true }),
      ...rows.map((row) => new TableRow({ children: row.map(bodyCell) })),
    ],
  })
}

function headerParagraphs(meta: ProjectMeta): Paragraph[] {
  return [
    new Paragraph({ text: meta.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph(`Scope: ${meta.scope}`),
    new Paragraph(`Vendor: ${meta.vendor}`),
    new Paragraph(`Prepared: ${meta.preparedDate}`),
    new Paragraph(`Generated: ${new Date().toISOString().slice(0, 10)}`),
    new Paragraph({ text: '' }),
  ]
}

function displayRemark(item: Item, sheet: DetailSheet | undefined): string {
  return item.no === 3 && sheet ? item3Remark(sheet) : (item.remark ?? '')
}

// ---------------------------------------------------------------------------
// MAR — one table per group
// ---------------------------------------------------------------------------

function buildMarBody(items: Item[], sheets: DetailSheet[]): (Paragraph | Table)[] {
  const sheetByItemNo = new Map(sheets.map((s) => [s.itemNo, s]))
  const header = ['#', 'Document Name', 'Standard', 'Requirement', 'Priority', 'Status', 'Remark']
  const body: (Paragraph | Table)[] = []
  for (const group of GROUP_DEFS) {
    const groupItems = items.filter((item) => item.group === group.id)
    if (groupItems.length === 0) continue
    body.push(new Paragraph({ text: `${group.label} (Items ${group.itemRange})`, heading: HeadingLevel.HEADING_2 }))
    const rows = groupItems.map((item) => {
      const sheet = sheetByItemNo.get(item.no)
      const status = effectiveStatus(item, sheet) + (item.manualStatus ? ' (MANUAL)' : '')
      return [
        String(item.no),
        item.name,
        item.standard,
        item.requirement,
        item.priority ?? '',
        status,
        displayRemark(item, sheet),
      ]
    })
    body.push(makeTable(header, rows))
    body.push(new Paragraph({ text: '' }))
  }
  return body
}

export async function buildMarDocx(items: Item[], sheets: DetailSheet[], meta: ProjectMeta): Promise<Blob> {
  const doc = new Document({
    sections: [{ children: [...headerParagraphs(meta), ...buildMarBody(items, sheets)] }],
  })
  return Packer.toBlob(doc)
}

// ---------------------------------------------------------------------------
// AOT / DOA — one table per lifecycle phase
// ---------------------------------------------------------------------------

function phaseLabel(item: Item): string {
  const def = LIFECYCLE_PHASE_DEFS.find((d) => d.id === item.phase)
  return def?.label ?? 'Unassigned'
}

function buildPhaseBody(items: Item[]): (Paragraph | Table)[] {
  const header = [
    'Code',
    'Document Name',
    'Standard',
    'Requirement',
    'Importance / Doc Type',
    'Site',
    'Workflow Status',
    'Document Date',
    'Expiry Date',
    'Responsible',
  ]
  const groups = [...LIFECYCLE_PHASE_DEFS.map((d) => d.label), 'Unassigned']
  const body: (Paragraph | Table)[] = []
  for (const label of groups) {
    const groupItems = items.filter((item) => phaseLabel(item) === label)
    if (groupItems.length === 0) continue
    body.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }))
    const rows = groupItems.map((item) => [
      item.code ?? String(item.no),
      item.name,
      item.standard,
      item.requirement,
      item.importance ?? item.docType ?? '',
      item.site ? DOA_SITE_LABEL[item.site] : '',
      item.workflowStatus ?? '',
      item.documentDate ?? '',
      item.expiryDate ?? '',
      item.responsiblePerson ?? '',
    ])
    body.push(makeTable(header, rows))
    body.push(new Paragraph({ text: '' }))
  }
  return body
}

export async function buildPhaseDocx(items: Item[], meta: ProjectMeta): Promise<Blob> {
  const doc = new Document({
    sections: [{ children: [...headerParagraphs(meta), ...buildPhaseBody(items)] }],
  })
  return Packer.toBlob(doc)
}

// ---------------------------------------------------------------------------
// Dispatch + download
// ---------------------------------------------------------------------------

export interface ExportableProject {
  meta: ProjectMeta
  items: Item[]
  sheets: DetailSheet[]
}

/**
 * Covers mar/aot/doa only — ADS-B exports two separate, richly-styled
 * documents (Contractor + Employer, matching the reference templates in
 * masterfile/ADS-B_Installation_*) via dedicated ExportMenu items instead,
 * since each needs its own user-gesture-triggered download (see
 * adsbWordExport.ts's exportAdsbContractorWord/exportAdsbEmployerWord —
 * browsers block a second auto-triggered download fired from one click).
 */
export async function exportProjectWord(project: ExportableProject): Promise<void> {
  const kind = project.meta.templateKind ?? 'mar'
  const blob =
    kind === 'aot' || kind === 'doa'
      ? await buildPhaseDocx(project.items, project.meta)
      : await buildMarDocx(project.items, project.sheets, project.meta)
  downloadBlob(blob, `${projectFileSlug(project.meta)}-tracker.docx`)
}
