// Was a closed 'G1'..'G5' union; widened to plain string so admin-authored
// templates can define their own group ids (§ TemplateDefinition below).
// Cosmetic-only — read for display grouping (TrackerTable.tsx, excelExport.ts,
// wordExport.ts, DetailPanelHeader.tsx), never in derive.ts's status/rollup math.
export type GroupId = string

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
// 3 airports (see DoaDocType/DoaSite below). 'adsb' = the real ADS-B ground
// station/vehicle terminal (CATM) 96-item installation checklist (see
// AdsbResult/AdsbEmployerResult/AdsbHwPoint/AdsbInstallPhase below).
//
// Widened (the "(string & {})" branded-string trick) beyond these 4 literals
// so an admin-authored custom template's generated slug (§ TemplateDefinition
// below) remains assignable without an `as` cast, while the 4 built-in
// literals still autocomplete.
export type TemplateKind = 'mar' | 'aot' | 'doa' | 'adsb' | (string & {})

// AOT's own criticality marker (⚠️สำคัญ/ปกติ/📌ประกอบ/ด่านสำคัญ) — independent
// of Priority (A/B/C), which is MAR-specific and doesn't apply to AOT items.
export type AotImportance = 'Critical' | 'Normal' | 'Supporting' | 'CriticalCheckpoint'

// DOA's own document classification badge (🟢ใช้ร่วม/🔴บังคับ/🔵เฉพาะสถานที่) —
// independent of AotImportance/Priority, which don't apply to DOA items.
export type DoaDocType = 'Shared' | 'Mandatory' | 'SiteSpecific'

// Which of the DOA tracker's 3 airports (or all of them) an item applies to.
export type DoaSite = 'Shared' | 'KKC' | 'UTH' | 'URT'

// ADS-B checklist's own 5-phase technical breakdown (Design & Approval / Site
// Readiness / Installation / Testing & Commissioning / As-built & Handover) —
// independent of LifecyclePhase (a generic project-lifecycle bucket), exactly
// as GroupId (MAR's G1-G5) is independent of LifecyclePhase. Deliberately NOT
// collapsed onto LifecyclePhase's 7 values — these 5 stages are real,
// distinct working phases a reviewer needs to filter by.
export type AdsbInstallPhase =
  | 'DesignApproval'
  | 'SiteReadiness'
  | 'Installation'
  | 'TestingCommissioning'
  | 'AsBuiltHandover'

// The Contractor's own self-check outcome per item (manual, blank by default).
export type AdsbResult = 'Pass' | 'Fail' | 'NotApplicable'

// The Employer's separate acceptance decision — only meaningful for items
// where employerIncluded is true. Independent of AdsbResult: a real
// installation checklist has two distinct sign-offs, not one.
export type AdsbEmployerResult = 'Accepted' | 'Conditional' | 'Rejected'

// Hold Point (work must stop for Employer witness) vs Witness Point (Employer
// may observe but need not stop work) — only set for the subset of
// employerIncluded items that carry one in the source ITP.
export type AdsbHwPoint = 'Hold' | 'Witness'

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
  // adsb-only fields — absent for MAR/AOT/DOA items.
  nameTh?: string // Thai item text (name holds the English text, per other templates)
  requirementTh?: string // Thai acceptance criteria (requirement holds the English text)
  torRef?: string // TOR clause ref, e.g. "2.2.6" — real for 13/96 items, else undefined
  resp?: string // raw E/C/S responsibility combo as in source, e.g. "S,C"
  installPhase?: AdsbInstallPhase
  measured?: string // free text, manual, blank by default
  result?: AdsbResult // Contractor's own outcome, manual, blank by default
  employerIncluded?: boolean // true for the 80/96 items that also appear in the Employer ITP
  requiredEvidence?: string // Employer's "required evidence" (EN) — only set when employerIncluded
  requiredEvidenceTh?: string // same, Thai
  hwPoint?: AdsbHwPoint
  employerResult?: AdsbEmployerResult // Employer's own outcome, manual, blank by default
  employerRemark?: string // Employer's own free-text remark — independent of `remark` (Contractor's)
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

// Moved here (from domain/rules.ts) so both rules.ts (the built-in MAR
// definitions) and templateRegistry.ts (the generic template registry) can
// share one definition without rules.ts -> types.ts -> rules.ts circularity.
export interface GroupDef {
  id: GroupId
  label: string
  itemRange?: string
}

export interface PriorityDef {
  id: Priority
  label: string
  description: string
}

// A template's own free-text "critical cutoff" notice — generalizes the
// pattern already used ad hoc by CRITICAL_SEQUENCE (MAR, domain/rules.ts) and
// AOT_CRITICAL_NOTICE (data/aotTemplate.ts). Absent entirely for templates
// with no equivalent real notice to show (DOA, ADS-B, and any custom template
// that doesn't define one) — never fabricated.
export interface CriticalNotice {
  heading: string
  lines: string[]
}

/**
 * The full shape of a checklist template — what "Add Project" clones into a
 * brand-new ProjectRecord (§ createProject). The 4 shipped kinds (mar/aot/
 * doa/adsb) are represented as built-in TemplateDefinitions (see
 * domain/templateRegistry.ts, built from their existing static data files);
 * an admin can override one of those, or create an entirely new one, via the
 * /templates admin section — those are persisted in the checklist_templates
 * table and merged over the built-ins at read time (mergeTemplates).
 *
 * Deliberately reuses Item/DetailSheet/CheckColumn/CheckRow as-is rather than
 * inventing a parallel "template item" shape — a template's `items`/`sheets`
 * are exactly the blank blueprint arrays a new ProjectRecord's own
 * items/sheets start as.
 */
export interface TemplateDefinition {
  id: TemplateKind
  isBuiltin: boolean
  label: string
  description: string
  // 'full' = the MAR-style tab set (Tracker/Priority A-B-C/Item Details/Phase
  // Progress/Guidelines, plus Project Management/BOQ Estimate). 'single' = the
  // AOT/DOA/adsb-style set (Dashboard + Project Management + BOQ Estimate only).
  tabSet: 'full' | 'single'
  hasDetailSheets: boolean
  hasGroups: boolean
  // When true, priorities is always exactly 3 entries with fixed ids A/B/C —
  // see CLAUDE.md/plan notes on why priority count itself isn't generalized.
  hasPriority: boolean
  // Whether "Add Project"'s MAR-only "Default phase" picker applies to this template.
  supportsDefaultPhase: boolean
  groups: GroupDef[] // [] when hasGroups is false
  priorities: PriorityDef[] // [] when hasPriority is false, else exactly 3 (A/B/C)
  criticalNotice?: CriticalNotice
  items: Item[] // the blank/unticked blueprint cloned by createProject/resetToSeed
  sheets: DetailSheet[] // the blank blueprint sheets ([] when hasDetailSheets is false)
}

export type HistoryField =
  | 'workflowStatus'
  | 'phase'
  | 'documentDate'
  | 'expiryDate'
  | 'responsiblePerson'
  | 'documentLink'
  | 'remark'
  | 'measured'
  | 'result'
  | 'employerResult'
  | 'employerRemark'
  | 'name'
  | 'standard'
  | 'requirement'
  | 'priority'
  | 'group'
  | 'importance'
  | 'docType'
  | 'site'
  | 'nameTh'
  | 'requirementTh'
  | 'torRef'
  | 'resp'
  | 'installPhase'
  | 'requiredEvidence'
  | 'requiredEvidenceTh'
  | 'hwPoint'

export interface HistoryEntry {
  id: string
  timestamp: string // ISO datetime
  itemNo: number
  field: HistoryField
  from: string | undefined
  to: string | undefined
  changedBy: string // signed-in reviewer's identity (email)
}

// Project Management tab (Gantt-style delivery schedule) — generic
// project-schedule data, independent of checklist structure. Applies to
// every TemplateKind alike, unlike LifecyclePhase/GroupId which are
// checklist-structure concepts. No audit trail: HistoryField/HistoryEntry
// are keyed by itemNo and don't fit phase/milestone edits.
export type MilestoneType = 'Delivery' | 'Committee' | 'Extension' | 'Other'

// A work-breakdown sub-task under a SchedulePhase — added 2026-09-02. Always
// rendered as an indented sub-row under its phase on the Gantt chart (no
// expand/collapse toggle). Same shape as SchedulePhase minus `code`.
export interface PhaseActivity {
  id: string
  name: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string // ISO yyyy-mm-dd
  percentComplete: number // 0-100, manual, reviewer-entered — never derived
  // 0-100, manual — this activity's share of its PARENT PHASE (not the whole
  // project), same two-axis pattern as SchedulePhase.percentComplete vs
  // weightPercent above, one level down. Optional for backward-compat;
  // treated as 0 by totalActivityWeightPercent (domain/schedule.ts).
  weightPercent?: number
}

export interface SchedulePhase {
  id: string
  name: string // e.g. "Phase 4 (DM)"
  code?: string // optional short code, e.g. "DM"
  startDate: string // ISO yyyy-mm-dd
  endDate: string // ISO yyyy-mm-dd
  percentComplete: number // 0-100, manual, reviewer-entered — never derived
  // 0-100, manual — this phase's share of the total project (a "payment
  // milestone" weight, e.g. งวดงาน 15%/70%/10%/5%), independent of
  // percentComplete (completion progress) — same two-axis pattern as
  // AotImportance vs Priority. Optional for backward-compat with phases that
  // predate this field; treated as 0 by totalWeightPercent (domain/schedule.ts).
  weightPercent?: number
  // Work-breakdown sub-tasks under this phase, always rendered as indented
  // sub-rows on the Gantt chart (no expand/collapse) — added 2026-09-02.
  // Optional for backward-compat; treated as [] by every reader (GanttChart.tsx,
  // scheduleExcelExport.ts, totalActivityWeightPercent).
  activities?: PhaseActivity[]
}

export interface ScheduleMilestone {
  id: string
  label: string
  date: string // ISO yyyy-mm-dd
  type: MilestoneType
}

export interface ProjectSchedule {
  phases: SchedulePhase[]
  milestones: ScheduleMilestone[]
  contractStartDate?: string // ISO yyyy-mm-dd — dashed reference line on the timeline
}

// BOQ Estimate tab (Bill-of-Quantities cost estimate, styled after the real
// ปร.4/ปร.5 Thai government forms) — generic project-costing data,
// independent of checklist structure, shown for every TemplateKind alike,
// same posture as ProjectSchedule above. Only the reference site's
// structural format (categories, per-line qty×rate math, VAT) is modeled;
// its placeholder item content is never reproduced — every project starts
// with zero categories/lines. Category/line numbering ("1.1", "2.3") is
// derived at render time from array order, never stored.
export interface BoqLine {
  id: string
  description: string
  quantity: number
  unit: string // short text, e.g. "set", "m", "ea"
  materialUnitCost: number
  laborUnitCost: number
  // Free-text reviewer remark, shown as the "หมายเหตุ" column in the BOQ
  // Excel export (src/domain/export/boqExcelExport.ts). Optional for
  // backward-compat with lines created before this field existed.
  remark?: string
}

export interface BoqCategory {
  id: string
  name: string // e.g. "Category 1" — user-renamable
  lines: BoqLine[]
}

export interface BoqEstimate {
  categories: BoqCategory[]
  vatPercent: number // default 7, editable
}

export interface ProjectRecord {
  meta: ProjectMeta
  items: Item[]
  sheets: DetailSheet[]
  history: HistoryEntry[]
  schedule?: ProjectSchedule // optional for backward-compat — pre-existing rows predate this field
  boq?: BoqEstimate // optional for backward-compat — pre-existing rows predate this field
}

// A row from a captured e-GP (gprocurement.go.th) search-results snapshot —
// see data/procurementLeads.ts. Not a tracked project; a candidate lead a
// reviewer might turn into one via "Add Project".
export interface ProcurementLead {
  no: number
  agency: string // หน่วยงาน
  purchasingUnit: string // หน่วยจัดซื้อ
  projectName: string // ชื่อโครงการ — verbatim, includes the trailing "(เลขที่โครงการ : ...)"
  budgetTHB: number // วงเงินงบประมาณ (บาท)
  status: string // สถานะโครงการ — one of the real Thai status strings e-GP uses
}
