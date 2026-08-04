import * as XLSX from 'xlsx'
import type { DetailSheet, Item, ProjectMeta } from '../../data/types'
import { effectiveStatus, item3Remark, rollup } from '../derive'
import {
  CRITICAL_SEQUENCE,
  DETAIL_SHEET_ORDER,
  GROUP_DEFS,
  LIFECYCLE_PHASE_DEFS,
  PRIORITY_DEFS,
} from '../rules'
import { selectPhaseSummary } from '../../store/selectors'
import { DOA_SITE_LABEL } from '../../data/doaTemplate'
import { downloadBlob } from './download'
import { projectFileSlug } from './filename'

type AOA = (string | number | boolean)[][]

function sheetFromRows(rows: AOA): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(rows)
}

/** Excel sheet names: <=31 chars, no []:*?/\ characters. */
function safeSheetName(name: string): string {
  return name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31)
}

function displayRemark(item: Item, sheet: DetailSheet | undefined): string {
  return item.no === 3 && sheet ? item3Remark(sheet) : (item.remark ?? '')
}

// ---------------------------------------------------------------------------
// MAR
// ---------------------------------------------------------------------------

function buildMarTrackerRows(items: Item[], sheetByItemNo: Map<number, DetailSheet>): AOA {
  const header = ['#', 'Group', 'Document Name', 'Standard', 'Requirement', 'Priority', 'Status', 'Remark']
  const rows: AOA = [header]
  for (const group of GROUP_DEFS) {
    const groupItems = items.filter((item) => item.group === group.id)
    if (groupItems.length === 0) continue
    rows.push([`${group.label} (Items ${group.itemRange})`])
    for (const item of groupItems) {
      const sheet = sheetByItemNo.get(item.no)
      rows.push([
        item.no,
        item.group ?? '',
        item.name,
        item.standard,
        item.requirement,
        item.priority ?? '',
        effectiveStatus(item, sheet) + (item.manualStatus ? ' (MANUAL)' : ''),
        displayRemark(item, sheet),
      ])
    }
  }
  return rows
}

function buildMarSummaryRows(items: Item[], sheets: DetailSheet[]): AOA {
  const r = rollup(items, sheets)
  const rows: AOA = [
    ['Dashboard Summary'],
    [],
    ['Total items', r.totalItems],
    [],
    ['By status'],
    ...(Object.entries(r.byStatus) as [string, number][]).map(([status, count]) => [status, count]),
    [],
    ['By priority', 'Total', 'Submitted'],
    ...PRIORITY_DEFS.map((def) => [def.label, r.byPriority[def.id].total, r.byPriority[def.id].done]),
    [],
    ['Checkbox roll-up'],
    ['Required', r.checkboxRollup.req],
    ['Done', r.checkboxRollup.done],
    [
      'Percent',
      r.checkboxRollup.req === 0
        ? '0%'
        : `${Math.round((r.checkboxRollup.done / r.checkboxRollup.req) * 100)}%`,
    ],
    [],
    ['Integrity check', r.integrityOK ? 'PASS' : 'FAIL'],
    [],
    ['Critical sequence'],
    ...CRITICAL_SEQUENCE.map((line) => [line]),
  ]
  return rows
}

function buildDetailSheetRows(sheet: DetailSheet): AOA {
  const header = ['Article', 'Description', ...sheet.columns.map((c) => c.label), 'Remark']
  const rows: AOA = [header]
  for (const row of sheet.rows) {
    if (row.section) rows.push([row.section])
    rows.push([
      row.article ?? '',
      row.description,
      ...sheet.columns.map((c) => (row.cells[c.key] ? 'TRUE' : 'FALSE')),
      row.remark ?? '',
    ])
  }
  return rows
}

export function buildMarWorkbook(items: Item[], sheets: DetailSheet[]): XLSX.WorkBook {
  const sheetByItemNo = new Map(sheets.map((s) => [s.itemNo, s]))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheetFromRows(buildMarTrackerRows(items, sheetByItemNo)), 'Tracker')
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(buildMarSummaryRows(items, sheets)),
    safeSheetName('Dashboard Summary'),
  )
  for (const itemNo of DETAIL_SHEET_ORDER) {
    const sheet = sheetByItemNo.get(itemNo)
    if (!sheet) continue
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(buildDetailSheetRows(sheet)),
      safeSheetName(`Item ${itemNo}`),
    )
  }
  return wb
}

// ---------------------------------------------------------------------------
// AOT / DOA (Phase Progress-shaped)
// ---------------------------------------------------------------------------

function phaseLabel(item: Item): string {
  const def = LIFECYCLE_PHASE_DEFS.find((d) => d.id === item.phase)
  return def?.label ?? 'Unassigned'
}

function buildPhaseRegisterRows(items: Item[]): AOA {
  const header = [
    'Code',
    'Document Name',
    'Standard',
    'Requirement',
    'Importance / Doc Type',
    'Site',
    'Phase',
    'Workflow Status',
    'Document Date',
    'Expiry Date',
    'Responsible Person',
    'Document Link',
  ]
  const rows: AOA = [header]
  for (const item of items) {
    rows.push([
      item.code ?? String(item.no),
      item.name,
      item.standard,
      item.requirement,
      item.importance ?? item.docType ?? '',
      item.site ? DOA_SITE_LABEL[item.site] : '',
      phaseLabel(item),
      item.workflowStatus ?? '',
      item.documentDate ?? '',
      item.expiryDate ?? '',
      item.responsiblePerson ?? '',
      item.documentLink ?? '',
    ])
  }
  return rows
}

function buildPhaseSummaryRows(items: Item[]): AOA {
  const summary = selectPhaseSummary(items)
  const rows: AOA = [
    ['Phase Summary'],
    [],
    ['Phase', 'Done', 'Total', 'Percent', 'In Preparation'],
    ...summary.phases.map((p) => [p.phase.label, p.done, p.total, `${p.percent}%`, p.inPreparation]),
    [
      'Unassigned',
      summary.unassigned.done,
      summary.unassigned.total,
      `${summary.unassigned.percent}%`,
      summary.unassigned.inPreparation,
    ],
  ]
  return rows
}

export function buildPhaseWorkbook(items: Item[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheetFromRows(buildPhaseRegisterRows(items)), 'Register')
  XLSX.utils.book_append_sheet(wb, sheetFromRows(buildPhaseSummaryRows(items)), 'Summary')
  return wb
}

// ---------------------------------------------------------------------------
// Dispatch + download
// ---------------------------------------------------------------------------

export interface ExportableProject {
  meta: ProjectMeta
  items: Item[]
  sheets: DetailSheet[]
}

function buildWorkbook(project: ExportableProject): XLSX.WorkBook {
  const kind = project.meta.templateKind ?? 'mar'
  if (kind === 'aot' || kind === 'doa') return buildPhaseWorkbook(project.items)
  return buildMarWorkbook(project.items, project.sheets)
}

/**
 * ADS-B uses a richly-styled, exceljs-based workbook (matching the reference
 * templates in masterfile/ADS-B_Installation_*) instead of the plain
 * aoa-to-sheet workbooks the other three kinds use — see adsbExcelExport.ts.
 */
export async function exportProjectExcel(project: ExportableProject): Promise<void> {
  if ((project.meta.templateKind ?? 'mar') === 'adsb') {
    const { exportAdsbExcel } = await import('./adsbExcelExport')
    return exportAdsbExcel(project.items, project.meta)
  }
  const wb = buildWorkbook(project)
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, `${projectFileSlug(project.meta)}-tracker.xlsx`)
}
