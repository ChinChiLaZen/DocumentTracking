// The vendor-neutral MAR checklist structure (§2.1: "the same evaluation
// standard... applies to every vendor"). Item/sheet definitions here — names,
// standards, requirements, sheet columns/rows — are shared by every project.
// Per-project instance data (real tick state, manual overrides) lives in
// `initialProjects.ts`; a brand-new project clones TEMPLATE_ITEMS/TEMPLATE_SHEETS
// as-is (every cell false, no overrides).
import type { CheckColumn, CheckRow, DetailSheet, GroupId, Item, Priority } from './types'

export function groupFor(no: number): GroupId {
  if (no <= 8) return 'G1'
  if (no <= 12) return 'G2'
  if (no <= 21) return 'G3'
  if (no <= 27) return 'G4'
  return 'G5'
}

export function priorityFor(no: number): Priority {
  if (no === 28 || no <= 10) return 'A'
  if (no <= 24) return 'B'
  return 'C'
}

interface ItemSource {
  name: string
  standard: string
  requirement: string
  hasSheet?: boolean
}

export const ITEM_SOURCE: Record<number, ItemSource> = {
  1: {
    name: 'Technical Datasheet / Product Catalogs — All Fixture Types',
    standard: 'Clause 1.4.E',
    requirement:
      'Model number, ordering reference, rating, dimension, material, photometric data covering ALL fixture types: Approach (inset/elevated), Sequence Flashing (incl. control cabinet), Threshold, Wing Bar, Runway Edge / Centreline / TDZ / End, RETIL, Stop Bar, Runway Guard, Taxiway CL/Edge, Intermediate Holding, PAPI, Guidance Sign',
    hasSheet: true,
  },
  2: {
    name: 'Third-Party Certificates — All Fixture Types',
    standard: 'Clause 1.4.O / ICAO Annex 14 / IEC TS 61827 / FAA AC 150/5345-46E',
    requirement:
      'Original certificates only (manufacturer declarations / brochure statements NOT acceptable). All certificates must be valid, reference the latest applicable edition, and include a summary table showing validity/expiry date of each certificate.',
    hasSheet: true,
  },
  3: {
    name: 'FAA ALECP Listing (AC 150/5345-53 Addendum) — or written explanation if not available',
    standard: 'AC 150/5345-53D Addendum',
    requirement:
      'If certification body is not in the Addendum, submit an Equivalent Acceptance request supported by technical evidence (e.g. CAAC or BV) demonstrating equivalence — for Consultant review BEFORE MAR submission.',
    hasSheet: true,
  },
  4: {
    name: 'Complete LM-79 Test Reports — All LED Fixture Models Proposed',
    standard: 'Clause 1.4.P.1–5',
    requirement:
      'Testing laboratory, test date, and report number clearly identified. A mapping table linking each proposed luminaire model to its LM-79 report number shall be provided.',
    hasSheet: true,
  },
  5: {
    name: 'LM-80 Test Reports & TM-21 Evaluation Reports',
    standard: 'Clause 1.4.P.1–5',
    requirement: 'Evidence of L70 lifetime ≥ 50,000 hours at 25 °C for ALL LED families used.',
    hasSheet: true,
  },
  6: {
    name: 'Dimming Curve Data per FAA EB-67',
    standard: 'Clause 2.5.N / FAA EB-67D',
    requirement:
      'Measured luminous intensity vs. current level data for EACH fixture type, including comparison against EB-67 tolerance criteria. EB-67 edition referenced shall be clearly identified.',
    hasSheet: true,
  },
  7: {
    name: 'Corrosion Test Report',
    standard: 'Clause 2.2.B / ISO 9227 / IEC 61827',
    requirement:
      'Reports from accredited laboratory (salt spray / corrosion resistance). Reports shall identify material type, test conditions, and results. Manufacturer declarations NOT acceptable.',
    hasSheet: true,
  },
  8: {
    name: 'Confirmation of Sequence Flashing System Light Intensity Levels',
    standard: '28 01 00 – SFL §3 / FAA AC 150/5345-51',
    requirement:
      'Technical documentation confirming adjustable intensity: HI 100% / MI 10% / LI 3% per Project Specification, supported by test results.',
  },
  9: {
    name: 'Isolation Transformer — Specification & Type Test',
    standard: 'IEC 61823 / FAA L-830 / L-831',
    requirement:
      "Datasheets for each size/rating + valid certificates or type test reports (not expired). Brochures claiming 'low leakage inductance' without supporting technical data NOT acceptable.",
    hasSheet: true,
  },
  10: {
    name: 'RCMU / SLC (Lamp Control Unit) — Specification & Type Test',
    standard: '28 01 00 / 28 05 00',
    requirement:
      'Complete technical specifications, PLC communication protocol, type test reports, and evidence of interoperability with CCR-I and I-ALCMS.',
    hasSheet: true,
  },
  11: {
    name: 'Fixture Base, Connector Kits & Accessories',
    standard: 'FAA L-823 / L-867 / L-868',
    requirement:
      'Complete specifications and applicable reference standards for all items to be supplied.',
    hasSheet: true,
  },
  12: {
    name: 'CCR-I Test Reports for Missing Sizes / Ratings',
    standard: 'IEC 61822 / IEC 61820-3-2',
    requirement:
      'Current BV certificate covers 2.5 / 5 / 30 kVA only. Additional test reports or formal manufacturer confirmation for ALL sizes to be used in the Project.',
    hasSheet: true,
  },
  13: {
    name: 'Point-wise Compliance Statement',
    standard: 'Clause 1.4.D',
    requirement:
      'Clause-by-clause compliance response signed by Manufacturer, Authorized Representative, AND Contractor. Each item supported by referenced documents with page numbers. Audit Form fully completed (Product Name, Test Result, Project Reference, Letter of Acceptance).',
  },
  14: {
    name: 'Installation Plan, Connection Diagram & Circuit Calculation',
    standard: 'Clause 1.4.A',
    requirement: 'Covering all equipment and subsystems in the Project scope.',
  },
  15: {
    name: 'CCR Sizing Calculation (incl. 25% power margin)',
    standard: 'Clause 1.4.J.2',
    requirement:
      'Calculation shall include cable losses, transformer losses, fixture loads, and RCMU loads for all circuits. At least one typical calculation per circuit type required prior to approval.',
  },
  16: {
    name: 'Coordination & Compatibility Study — Complete Version',
    standard: 'Clause 1.2.B / 1.4.P.8',
    requirement:
      'System study + integration test results: LED fixtures – RCMU – CCR-I – I-ALCMS. Joint integration test report required; a single declaration NOT acceptable.',
  },
  17: {
    name: 'Acceptance Inspection & Testing Plan',
    standard: 'Clause 1.4.B',
    requirement: 'Minimum: preliminary version on date of MAR submission.',
  },
  18: {
    name: 'Site Acceptance Sheets',
    standard: 'Clause 1.4.K',
    requirement: 'Minimum: preliminary version on date of MAR submission.',
  },
  19: {
    name: 'Equipment & Software Information for Commissioning',
    standard: 'Clause 1.4.M',
    requirement: 'Minimum: preliminary version on date of MAR submission.',
  },
  20: {
    name: "Manufacturer's Drawings",
    standard: 'Clause 1.4.C',
    requirement: 'Installation and electrical wiring drawings for ALL equipment items.',
  },
  21: {
    name: 'Type Test / Factory Test Record — Key CCR Functions',
    standard: '28 01 00 – CCR Performance (E, F)',
    requirement:
      'CCR functional description shall cover: brightness level changes without power cycling, latch function, open-circuit protection, and LED load start-up. T&C stage demo = verification only.',
  },
  22: {
    name: 'Two-Year Warranty Letter — All Hardware',
    standard: 'Clause 1.6.A.1',
    requirement: '2-year warranty from date of substantial completion (project completion).',
  },
  23: {
    name: 'Five-Year Extended Warranty Letter — LED Products',
    standard: 'Clause 1.6.A.2, A.4(a–d)',
    requirement:
      'Covers LED drivers and power supplies. Written commitment for 4 obligations: (1) on-site replacement (removal, transport, installation); (2) replacement of LED source assemblies; (3) replacement of LED drivers; (4) replacement of complete fixtures where light output falls below ICAO requirements.',
  },
  24: {
    name: 'Three-Year Spare Parts & Consumables List (incl. prices)',
    standard: 'Clause 1.4.F / Clause 1.7',
    requirement:
      'Firm prices maintained for 3 years incl. inflation adjustment. Minimum qty = 10% per luminaire type covering: LED modules, drivers, prisms, gaskets, fuses, and all items under Clause 1.7.B.',
  },
  25: {
    name: 'Project References & Letter of Acceptance',
    standard: 'Clause 1.4.D (Audit Form)',
    requirement:
      'List of airports where the same product model was installed — international airports outside China preferred. Include acceptance certificates or official confirmation letters from airport owners.',
    hasSheet: true,
  },
  26: {
    name: 'Appointment Letter — Authorized Distributor / Service Provider in Thailand',
    standard: 'General Conditions of Contract',
    requirement:
      'Scope of after-sales support, local spare parts inventory, and response time in Thailand.',
    hasSheet: true,
  },
  27: {
    name: 'O&M Manuals & Training Program',
    standard: 'Clause 1.4 / 1.6',
    requirement:
      'Operation & maintenance manuals for all equipment + training program for operating personnel.',
    hasSheet: true,
  },
  28: {
    name: 'Official Vendor Approval / MAR Submission Letter issued by ITD',
    standard: 'Division 01 – Section 016000 Product Requirements',
    requirement:
      'Contractor (ITD) must formally submit all products for Vendor Approval / MAR. Consultant will NOT commence review based on documents submitted directly by Manufacturer. All documents under Groups 1–4 must be consolidated and submitted through this channel.',
  },
}

export const TEMPLATE_ITEMS: Item[] = Array.from({ length: 28 }, (_, i) => {
  const no = i + 1
  const source = ITEM_SOURCE[no]
  const item: Item = {
    no,
    group: groupFor(no),
    name: source.name,
    standard: source.standard,
    requirement: source.requirement,
    priority: priorityFor(no),
    // The MAR checklist structure is inherently a post-contract-award
    // submittal process (§1) — real, confirmed default, not a per-vendor guess.
    phase: 'AfterContract',
  }
  if (source.hasSheet) item.detailSheetId = `item-${no}`
  // Item 3's remark is generated by domain/derive.ts (§6.5) — never stored here.
  return item
})

/** The 19 fixture types shared verbatim across items 1, 2, 4, 5, 6, 7. */
export const FIXTURE_ROWS: { article: string; description: string }[] = [
  { article: '2.6', description: 'Approach Elevated Lights' },
  { article: '2.7', description: 'Approach Inset Lights' },
  { article: '2.8', description: 'Sequence Flashing Elevated Lights' },
  { article: '2.11', description: 'Threshold Inset Lights' },
  { article: '2.12', description: 'Combined Threshold/Runway End Inset Lights' },
  { article: '2.13', description: 'Threshold Wing Bar Elevated Lights' },
  { article: '2.15', description: 'Runway Edge Inset Lights' },
  { article: '2.18', description: 'Runway Touchdown Zone Inset Lights' },
  { article: '2.19', description: 'Runway Centre Line Inset Lights' },
  { article: '2.2', description: 'Taxiway Center Line Inset Lights' },
  { article: '2.22', description: 'Stop Bar Inset Lights' },
  { article: '2.23', description: 'Stop Bar Elevated Lights' },
  { article: '2.25', description: 'Runway Guard Elevated Lights' },
  { article: '2.27', description: 'Intermediate Holding Position Inset Lights' },
  { article: '2.29', description: 'Rapid Exit Taxiway Indicator Inset Lights' },
  { article: '2.3', description: 'PAPI Unit' },
  { article: '2.33', description: 'Illuminated Wind Cone' },
  { article: '2.34', description: 'Aircraft Guidance Signage' },
  { article: '', description: 'Taxiway Edge Light, Elevated Omni Directional (1,384)' },
]

function blankRow(
  id: string,
  article: string | undefined,
  description: string,
  columns: CheckColumn[],
): CheckRow {
  return {
    id,
    article,
    description,
    cells: Object.fromEntries(columns.map((c) => [c.key, false])),
    remark: '',
  }
}

function blankFixtureRows(
  columns: CheckColumn[],
  idPrefix: string,
  fixtures: { article: string; description: string }[] = FIXTURE_ROWS,
): CheckRow[] {
  return fixtures.map((f, i) => blankRow(`${idPrefix}-row-${i + 1}`, f.article || undefined, f.description, columns))
}

export const item1Columns: CheckColumn[] = [
  { key: 'model', label: 'Datasheet / Product Catalogue · Model No. / Ordering Ref.' },
  { key: 'rating', label: 'Rating' },
  { key: 'dimension', label: 'Dimension' },
  { key: 'material', label: 'Material' },
  { key: 'photometric', label: 'Photometric Data' },
]

export const item2Columns: CheckColumn[] = [{ key: 'thirdPartyCert', label: 'Third-Party Certificate' }]
export const item3Columns: CheckColumn[] = [{ key: 'faaAlecp', label: 'FAA ALECP Listing' }]
export const item4Columns: CheckColumn[] = [{ key: 'lm79', label: 'LM-79' }]
export const item5Columns: CheckColumn[] = [
  { key: 'lm80', label: 'LM-80 Test Reports' },
  { key: 'tm21', label: 'TM-21 Evaluation Reports' },
]
export const item6Columns: CheckColumn[] = [{ key: 'dimmingCurve', label: 'Dimming Curve Data' }]
export const item7Columns: CheckColumn[] = [{ key: 'corrosionReport', label: 'Corrosion Test Report' }]

export const item9Columns: CheckColumn[] = [
  { key: 'datasheet', label: 'Datasheet' },
  { key: 'testCert', label: 'Test Certification' },
  { key: 'typeTest', label: 'Type Test Report' },
]

export const item10Columns: CheckColumn[] = [
  { key: 'techSpec', label: 'Technical Specification' },
  { key: 'plcProtocol', label: 'PLC Communication Protocol' },
  { key: 'typeTest', label: 'Type Test Report' },
  { key: 'evidence', label: 'Evidence Demonstrating' },
]

export const specTestCertColumns: CheckColumn[] = [
  { key: 'specification', label: 'Specification' },
  { key: 'referenceStdTestCert', label: 'Reference Standard / Test Certificate' },
]

export const item25Columns: CheckColumn[] = [
  { key: 'projectRefs', label: 'Project References' },
  { key: 'letterOfAcceptance', label: 'Letter of Acceptance' },
]
export const item26Columns: CheckColumn[] = [
  { key: 'authorizedDistributor', label: 'Authorized Distributor' },
  { key: 'serviceProvider', label: 'Service Provider' },
]
export const item27Columns: CheckColumn[] = [
  { key: 'oAndMManuals', label: 'O&M Manuals' },
  { key: 'trainingProgram', label: 'Training Program' },
]

/** Blank checklist sheets (0/282 ticked) — the template any new project clones. */
export const TEMPLATE_SHEETS: DetailSheet[] = [
  {
    id: 'item-1',
    itemNo: 1,
    title: 'Technical Datasheet / Product Catalogs',
    applicable: ITEM_SOURCE[1].standard,
    columns: item1Columns,
    rows: blankFixtureRows(item1Columns, 'item-1'),
  },
  {
    id: 'item-2',
    itemNo: 2,
    title: 'Third-Party Certificates',
    applicable: ITEM_SOURCE[2].standard,
    columns: item2Columns,
    rows: [
      blankRow(
        'item-2-row-0',
        undefined,
        'Summary table indicating the validity/expiry date of each certificate',
        item2Columns,
      ),
      ...blankFixtureRows(item2Columns, 'item-2'),
    ],
  },
  {
    id: 'item-3',
    itemNo: 3,
    title: 'FAA ALECP Listing (AC 150/5345-53 Addendum)',
    applicable: ITEM_SOURCE[3].standard,
    columns: item3Columns,
    rows: [
      ...blankFixtureRows(item3Columns, 'item-3', FIXTURE_ROWS.slice(0, 18)),
      blankRow('item-3-row-19', '2.38 C', 'Primary Connector Kit', item3Columns),
      blankRow('item-3-row-20', '2.38 D', 'Secondary Connector Kit', item3Columns),
      blankRow('item-3-row-21', '2.39', 'Isolating Transformers', item3Columns),
      blankRow('item-3-row-22', '2.4', 'Constant Current Regulators', item3Columns),
      blankRow('item-3-row-23', '2.41', 'Light Bases', item3Columns),
      blankRow(
        'item-3-row-24',
        undefined,
        'Taxiway Edge Light, Elevated Omni Directional (1,384)',
        item3Columns,
      ),
      blankRow('item-3-row-25', undefined, 'ALCMS', item3Columns),
    ],
  },
  {
    id: 'item-4',
    itemNo: 4,
    title: 'Complete LM-79 Test Reports',
    applicable: ITEM_SOURCE[4].standard,
    columns: item4Columns,
    rows: blankFixtureRows(item4Columns, 'item-4'),
  },
  {
    id: 'item-5',
    itemNo: 5,
    title: 'LM-80 Test Reports & TM-21 Evaluation Reports',
    applicable: ITEM_SOURCE[5].standard,
    columns: item5Columns,
    rows: blankFixtureRows(item5Columns, 'item-5'),
  },
  {
    id: 'item-6',
    itemNo: 6,
    title: 'Dimming Curve Data per FAA EB-67',
    applicable: ITEM_SOURCE[6].standard,
    columns: item6Columns,
    rows: blankFixtureRows(item6Columns, 'item-6'),
  },
  {
    id: 'item-7',
    itemNo: 7,
    title: 'Corrosion Test Report',
    applicable: ITEM_SOURCE[7].standard,
    columns: item7Columns,
    rows: blankFixtureRows(item7Columns, 'item-7'),
  },
  {
    id: 'item-9',
    itemNo: 9,
    title: 'Isolation Transformer',
    applicable: ITEM_SOURCE[9].standard,
    columns: item9Columns,
    rows: [blankRow('item-9-row-1', '2.39', 'Series Isolating Transformers', item9Columns)],
  },
  {
    id: 'item-10',
    itemNo: 10,
    title: 'RCMU / SLC (Lamp Control Unit)',
    applicable: ITEM_SOURCE[10].standard,
    columns: item10Columns,
    rows: [blankRow('item-10-row-1', '5.6', 'RCMU / SLC (Lamp Control Unit)', item10Columns)],
  },
  {
    id: 'item-11',
    itemNo: 11,
    title: 'Fixture Base, Connector Kits & Accessories',
    applicable: ITEM_SOURCE[11].standard,
    columns: specTestCertColumns,
    rows: [
      blankRow('item-11-row-1', undefined, 'One plug, Style 3', specTestCertColumns),
      blankRow('item-11-row-2', undefined, 'One receptacle, Style 10', specTestCertColumns),
      blankRow('item-11-row-3', undefined, 'One plug, Style 4', specTestCertColumns),
      blankRow('item-11-row-4', undefined, 'One receptacle, Style 11', specTestCertColumns),
      blankRow('item-11-row-5', undefined, 'One plug, Style 5', specTestCertColumns),
      blankRow('item-11-row-6', undefined, 'One receptacle, Style 12', specTestCertColumns),
      blankRow('item-11-row-7', '2.41', 'Light Bases - L-867', specTestCertColumns),
      blankRow('item-11-row-8', '2.41', 'Light Bases - L-868', specTestCertColumns),
    ],
  },
  {
    id: 'item-12',
    itemNo: 12,
    title: 'CCR-I Test Reports for Missing Sizes / Ratings',
    applicable: ITEM_SOURCE[12].standard,
    columns: specTestCertColumns,
    rows: [
      blankRow('item-12-row-1', undefined, '1 kVA', specTestCertColumns),
      blankRow('item-12-row-2', undefined, '2.5 kVA', specTestCertColumns),
      blankRow('item-12-row-3', undefined, '5 kVA', specTestCertColumns),
      blankRow('item-12-row-4', undefined, '7.5 kVA', specTestCertColumns),
      blankRow('item-12-row-5', undefined, '10 kVA', specTestCertColumns),
      blankRow('item-12-row-6', undefined, '15 kVA', specTestCertColumns),
      blankRow('item-12-row-7', undefined, '20 kVA', specTestCertColumns),
      blankRow('item-12-row-8', undefined, '25 kVA', specTestCertColumns),
      blankRow('item-12-row-9', undefined, '30 kVA', specTestCertColumns),
    ],
  },
  {
    id: 'item-25',
    itemNo: 25,
    title: 'Project References & Letter of Acceptance',
    applicable: ITEM_SOURCE[25].standard,
    columns: item25Columns,
    rows: [
      blankRow(
        'item-25-row-1',
        undefined,
        'Project References and Letter of Acceptance',
        item25Columns,
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
      blankRow(
        'item-26-row-1',
        undefined,
        'Appointment letter for authorized distributor / service provider in Thailand',
        item26Columns,
      ),
    ],
  },
  {
    id: 'item-27',
    itemNo: 27,
    title: 'O&M Manuals & Training Program',
    applicable: ITEM_SOURCE[27].standard,
    columns: item27Columns,
    rows: [blankRow('item-27-row-1', undefined, 'O&M Manuals and Training Program', item27Columns)],
  },
]
