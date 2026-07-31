export type GroupId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5'

export type Priority = 'A' | 'B' | 'C'

export type Status =
  | 'Submitted' // all checks ticked
  | 'In Progress' // some checks ticked
  | 'Pending' // no checks ticked (or no detail sheet + manual default)
  | 'Needs Revision' // manual only
  | 'Not Available' // manual only

export type WorkflowStatus = 'Pending' | 'Preparing' | 'AwaitingApproval' | 'Ready' | 'Submitted'

// The real airport-project document lifecycle (independent of GroupId, which
// is a technical document category, e.g. "Fixture Certificates"). Unassigned
// is represented by item.phase === undefined — never conflated with 'Other',
// which is a genuine, distinct phase for miscellaneous documents.
export type LifecyclePhase =
  | 'PreBidding'
  | 'Bidding'
  | 'AfterContract'
  | 'InstallationCommissioning'
  | 'Warranty'
  | 'OperationMaintenance'
  | 'Other'

// Which checklist template a project was built from. 'mar' = the original
// U-Tapao-style 28-item checkbox register (group/priority/detail sheets all
// apply). 'aot' = the real Airports of Thailand 94-item bid-submission
// checklist (no groups/priority/detail sheets — see AotImportance below).
// 'doa' = the real Department of Airports 64-item document tracker spanning
// 3 airports (see DoaDocType/DoaSite below).
export type TemplateKind = 'mar' | 'aot' | 'doa'

// AOT's own criticality marker (⚠️สำคัญ/ปกติ/📌ประกอบ/ด่านสำคัญ) — independent
// of Priority (A/B/C), which is MAR-specific and doesn't apply to AOT items.
export type AotImportance = 'Critical' | 'Normal' | 'Supporting' | 'CriticalCheckpoint'

// DOA's own document classification badge (🟢ใช้ร่วม/🔴บังคับ/🔵เฉพาะสถานที่) —
// independent of AotImportance/Priority, which don't apply to DOA items.
export type DoaDocType = 'Shared' | 'Mandatory' | 'SiteSpecific'

// Which of the DOA tracker's 3 airports (or all of them) an item applies to.
export type DoaSite = 'Shared' | 'KKC' | 'UTH' | 'URT'

export interface Item {
  no: number // 1..28 for MAR items; 1..94 for AOT items; 1..64 for DOA items (see `code` for AOT/DOA's real identifier)
  group?: GroupId // MAR only — technical document category
  name: string
  standard: string // MAR: standard/clause. AOT: clause reference, e.g. "ข้อ 2.1-2.3"
  requirement: string // MAR: acceptance criteria. AOT: deadline-stage label + note
  priority?: Priority // MAR only — A/B/C essential/mandatory/supporting
  detailSheetId?: string // present only for the 14 MAR items that have a detail sheet
  manualStatus?: Status // set ONLY when the reviewer overrides (§6.3)
  remark?: string // free text OR a derived template (Item 3, §6.5)
  // AOT-only fields — absent for MAR/DOA items.
  code?: string // AOT/DOA's real identifier, e.g. "P0-S1-01" or "G1-REG" — shown instead of `no` when present
  importance?: AotImportance
  // DOA-only fields — absent for MAR/AOT items.
  docType?: DoaDocType
  site?: DoaSite
  // Phase Progress tab fields — independent of the checkbox-derived Status
  // above; never wired into effectiveStatus/autoStatus/rollup in derive.ts.
  workflowStatus?: WorkflowStatus
  phase?: LifecyclePhase
  documentDate?: string // ISO yyyy-mm-dd
  expiryDate?: string // ISO yyyy-mm-dd
  responsiblePerson?: string
  documentLink?: string
}

export interface CheckColumn {
  key: string
  label: string
}

export interface CheckRow {
  id: string
  article?: string // TOR article; may be blank for "missing in TOR" rows
  description: string
  cells: Record<string, boolean> // keyed by CheckColumn.key
  remark?: string
  section?: string // optional sub-heading, e.g. "Missing Item in TOR but stated in DWG"
}

export interface DetailSheet {
  id: string // "item-1"
  itemNo: number
  title: string
  applicable: string // standard string echoed in the sheet header
  columns: CheckColumn[]
  rows: CheckRow[]
}

export interface ProjectMeta {
  id: string
  title: string // e.g. "Civil Works — Second Runway & Taxiway, U-Tapao International Airport"
  scope: string // e.g. "Airfield Lighting, Section 28 01 00"
  vendor: string // e.g. "Airsafe Airport Equipment Co., Ltd."
  preparedDate: string // ISO yyyy-mm-dd
  templateKind?: TemplateKind // optional for backward-compat with pre-existing persisted data; absent = 'mar'
  // CSI MasterFormat division/section code (e.g. "26 51 13"), picked from
  // CSI_MASTER_FORMAT (data/csiMasterFormat.ts) on Add Project. Purely a
  // classification field, independent of templateKind/GroupId — never wired
  // into derive.ts. Optional; absent for projects created before this field
  // existed or left unset at creation time.
  projectType?: string
}

export type HistoryField =
  | 'workflowStatus'
  | 'phase'
  | 'documentDate'
  | 'expiryDate'
  | 'responsiblePerson'
  | 'documentLink'

export interface HistoryEntry {
  id: string
  timestamp: string // ISO datetime
  itemNo: number
  field: HistoryField
  from: string | undefined
  to: string | undefined
  changedBy: string // signed-in reviewer's identity (email)
}

export interface ProjectRecord {
  meta: ProjectMeta
  items: Item[]
  sheets: DetailSheet[]
  history: HistoryEntry[]
}
