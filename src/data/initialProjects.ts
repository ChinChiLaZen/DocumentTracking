// The initial project registry. Structural definitions (item/sheet templates)
// live in `checklistTemplate.ts`; this module supplies per-project instance
// data — for U-Tapao/Airsafe, the real tick state sourced 2026-07-25 from the
// two Lovable reference prototypes named in CLAUDE.md §1 (prototype seed data,
// not the real Airsafe workbook, but real content rather than a placeholder).
import type { CheckColumn, CheckRow, DetailSheet, Item, ProjectRecord } from './types'
import {
  FIXTURE_ROWS,
  ITEM_SOURCE,
  TEMPLATE_ITEMS,
  TEMPLATE_SHEETS,
  item1Columns,
  item2Columns,
  item3Columns,
  item4Columns,
  item5Columns,
  item6Columns,
  item7Columns,
  item9Columns,
  item10Columns,
  item25Columns,
  item26Columns,
  item27Columns,
  specTestCertColumns,
} from './checklistTemplate'

export const UTAPAO_PROJECT_ID = 'utapao-airsafe'
export const DEMO_PROJECT_ID = 'demo-placeholder'

const ROW_REMARK = 'Rev.0 - 20260725'

function row(
  id: string,
  article: string | undefined,
  description: string,
  columns: CheckColumn[],
  bits: string,
): CheckRow {
  return {
    id,
    article,
    description,
    cells: Object.fromEntries(columns.map((c, i) => [c.key, bits[i] === '1'])),
    remark: ROW_REMARK,
  }
}

function fixtureRows(
  bitsPerRow: string[],
  columns: CheckColumn[],
  idPrefix: string,
  fixtures: { article: string; description: string }[] = FIXTURE_ROWS,
): CheckRow[] {
  return fixtures.map((f, i) => ({
    id: `${idPrefix}-row-${i + 1}`,
    article: f.article || undefined,
    description: f.description,
    cells: Object.fromEntries(columns.map((c, ci) => [c.key, bitsPerRow[i][ci] === '1'])),
    remark: ROW_REMARK,
  }))
}

const utapaoSheets: DetailSheet[] = [
  {
    id: 'item-1',
    itemNo: 1,
    title: 'Technical Datasheet / Product Catalogs',
    applicable: ITEM_SOURCE[1].standard,
    columns: item1Columns,
    rows: fixtureRows(Array(19).fill('11110'), item1Columns, 'item-1'),
  },
  {
    id: 'item-2',
    itemNo: 2,
    title: 'Third-Party Certificates',
    applicable: ITEM_SOURCE[2].standard,
    columns: item2Columns,
    rows: [
      row(
        'item-2-row-0',
        undefined,
        'Summary table indicating the validity/expiry date of each certificate',
        item2Columns,
        '0',
      ),
      ...fixtureRows(Array(19).fill('1'), item2Columns, 'item-2'),
    ],
  },
  {
    id: 'item-3',
    itemNo: 3,
    title: 'FAA ALECP Listing (AC 150/5345-53 Addendum)',
    applicable: ITEM_SOURCE[3].standard,
    columns: item3Columns,
    rows: [
      ...fixtureRows(
        ['0', '0', '0', '1', '1', '0', '1', '0', '1', '1', '0', '0', '0', '0', '0', '0', '0', '0'],
        item3Columns,
        'item-3',
        FIXTURE_ROWS.slice(0, 18),
      ),
      row('item-3-row-19', '2.38 C', 'Primary Connector Kit', item3Columns, '0'),
      row('item-3-row-20', '2.38 D', 'Secondary Connector Kit', item3Columns, '0'),
      row('item-3-row-21', '2.39', 'Isolating Transformers', item3Columns, '0'),
      row('item-3-row-22', '2.4', 'Constant Current Regulators', item3Columns, '0'),
      row('item-3-row-23', '2.41', 'Light Bases', item3Columns, '0'),
      row(
        'item-3-row-24',
        undefined,
        'Taxiway Edge Light, Elevated Omni Directional (1,384)',
        item3Columns,
        '0',
      ),
      row('item-3-row-25', undefined, 'ALCMS', item3Columns, '0'),
    ],
  },
  {
    id: 'item-4',
    itemNo: 4,
    title: 'Complete LM-79 Test Reports',
    applicable: ITEM_SOURCE[4].standard,
    columns: item4Columns,
    rows: fixtureRows(Array(19).fill('0'), item4Columns, 'item-4'),
  },
  {
    id: 'item-5',
    itemNo: 5,
    title: 'LM-80 Test Reports & TM-21 Evaluation Reports',
    applicable: ITEM_SOURCE[5].standard,
    columns: item5Columns,
    rows: fixtureRows(Array(19).fill('00'), item5Columns, 'item-5'),
  },
  {
    id: 'item-6',
    itemNo: 6,
    title: 'Dimming Curve Data per FAA EB-67',
    applicable: ITEM_SOURCE[6].standard,
    columns: item6Columns,
    rows: fixtureRows(Array(19).fill('0'), item6Columns, 'item-6'),
  },
  {
    id: 'item-7',
    itemNo: 7,
    title: 'Corrosion Test Report',
    applicable: ITEM_SOURCE[7].standard,
    columns: item7Columns,
    rows: fixtureRows(Array(19).fill('0'), item7Columns, 'item-7'),
  },
  {
    id: 'item-9',
    itemNo: 9,
    title: 'Isolation Transformer',
    applicable: ITEM_SOURCE[9].standard,
    columns: item9Columns,
    rows: [row('item-9-row-1', '2.39', 'Series Isolating Transformers', item9Columns, '110')],
  },
  {
    id: 'item-10',
    itemNo: 10,
    title: 'RCMU / SLC (Lamp Control Unit)',
    applicable: ITEM_SOURCE[10].standard,
    columns: item10Columns,
    rows: [row('item-10-row-1', '5.6', 'RCMU / SLC (Lamp Control Unit)', item10Columns, '1000')],
  },
  {
    id: 'item-11',
    itemNo: 11,
    title: 'Fixture Base, Connector Kits & Accessories',
    applicable: ITEM_SOURCE[11].standard,
    columns: specTestCertColumns,
    rows: [
      row('item-11-row-1', undefined, 'One plug, Style 3', specTestCertColumns, '00'),
      row('item-11-row-2', undefined, 'One receptacle, Style 10', specTestCertColumns, '00'),
      row('item-11-row-3', undefined, 'One plug, Style 4', specTestCertColumns, '11'),
      row('item-11-row-4', undefined, 'One receptacle, Style 11', specTestCertColumns, '11'),
      row('item-11-row-5', undefined, 'One plug, Style 5', specTestCertColumns, '00'),
      row('item-11-row-6', undefined, 'One receptacle, Style 12', specTestCertColumns, '00'),
      row('item-11-row-7', '2.41', 'Light Bases - L-867', specTestCertColumns, '11'),
      row('item-11-row-8', '2.41', 'Light Bases - L-868', specTestCertColumns, '11'),
    ],
  },
  {
    id: 'item-12',
    itemNo: 12,
    title: 'CCR-I Test Reports for Missing Sizes / Ratings',
    applicable: ITEM_SOURCE[12].standard,
    columns: specTestCertColumns,
    rows: [
      row('item-12-row-1', undefined, '1 kVA', specTestCertColumns, '00'),
      row('item-12-row-2', undefined, '2.5 kVA', specTestCertColumns, '11'),
      row('item-12-row-3', undefined, '5 kVA', specTestCertColumns, '11'),
      row('item-12-row-4', undefined, '7.5 kVA', specTestCertColumns, '00'),
      row('item-12-row-5', undefined, '10 kVA', specTestCertColumns, '00'),
      row('item-12-row-6', undefined, '15 kVA', specTestCertColumns, '00'),
      row('item-12-row-7', undefined, '20 kVA', specTestCertColumns, '00'),
      row('item-12-row-8', undefined, '25 kVA', specTestCertColumns, '00'),
      row('item-12-row-9', undefined, '30 kVA', specTestCertColumns, '11'),
    ],
  },
  {
    id: 'item-25',
    itemNo: 25,
    title: 'Project References & Letter of Acceptance',
    applicable: ITEM_SOURCE[25].standard,
    columns: item25Columns,
    rows: [
      row(
        'item-25-row-1',
        undefined,
        'Project References and Letter of Acceptance',
        item25Columns,
        '10',
      ),
    ],
  },
  {
    id: 'item-26',
    itemNo: 26,
    title: 'Appointment Letter — Distributor / Service Provider',
    applicable: ITEM_SOURCE[26].standard,
    columns: item26Columns,
    rows: [
      row(
        'item-26-row-1',
        undefined,
        'Appointment letter for authorized distributor / service provider in Thailand',
        item26Columns,
        '10',
      ),
    ],
  },
  {
    id: 'item-27',
    itemNo: 27,
    title: 'O&M Manuals & Training Program',
    applicable: ITEM_SOURCE[27].standard,
    columns: item27Columns,
    rows: [
      row('item-27-row-1', undefined, 'O&M Manuals and Training Program', item27Columns, '10'),
    ],
  },
]

function cloneItems(items: Item[]): Item[] {
  return items.map((item) => ({ ...item }))
}

function cloneSheets(sheets: DetailSheet[]): DetailSheet[] {
  return sheets.map((sheet) => ({
    ...sheet,
    rows: sheet.rows.map((r) => ({ ...r, cells: { ...r.cells } })),
  }))
}

const utapaoProject: ProjectRecord = {
  meta: {
    id: UTAPAO_PROJECT_ID,
    title: 'Civil Works — Second Runway & Taxiway, U-Tapao International Airport',
    scope: 'Airfield Lighting, Section 28 01 00',
    vendor: 'Airsafe Airport Equipment Co., Ltd.',
    preparedDate: '2026-07-07',
    templateKind: 'mar',
  },
  items: cloneItems(TEMPLATE_ITEMS),
  sheets: utapaoSheets,
  history: [],
}

const demoProject: ProjectRecord = {
  meta: {
    id: DEMO_PROJECT_ID,
    title: 'Demo Project — Sample Vendor',
    scope: 'Placeholder scope — replace or remove once a real second project exists',
    vendor: 'Sample Vendor Co., Ltd.',
    preparedDate: '2026-07-26',
    templateKind: 'mar',
  },
  items: cloneItems(TEMPLATE_ITEMS),
  sheets: cloneSheets(TEMPLATE_SHEETS),
  history: [],
}

export const INITIAL_PROJECTS: ProjectRecord[] = [utapaoProject, demoProject]
