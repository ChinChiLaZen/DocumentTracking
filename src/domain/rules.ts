import type { AdsbInstallPhase, GroupId, LifecyclePhase, Priority, WorkflowStatus } from '../data/types'

export interface GroupDef {
  id: GroupId
  label: string
  itemRange: string
}

export const GROUP_DEFS: GroupDef[] = [
  { id: 'G1', label: 'Group 1 — Fixture Certificates / LM-79 / LM-80 / TM-21', itemRange: '1–8' },
  { id: 'G2', label: 'Group 2 — Auxiliary Equipment', itemRange: '9–12' },
  { id: 'G3', label: 'Group 3', itemRange: '13–21' },
  { id: 'G4', label: 'Group 4', itemRange: '22–27' },
  { id: 'G5', label: 'Group 5 — MAR Submission Letter', itemRange: '28' },
]

export interface PriorityDef {
  id: Priority
  label: string
  description: string
}

export const PRIORITY_DEFS: PriorityDef[] = [
  {
    id: 'A',
    label: 'A — Essential',
    description: 'Required before any approval review commences.',
  },
  {
    id: 'B',
    label: 'B — Mandatory',
    description: 'Required by Clause 1.4 — complete upon MAR submission.',
  },
  {
    id: 'C',
    label: 'C — Supporting',
    description: 'Submitted with the MAR or as specified in the Contract.',
  },
]

export const CRITICAL_SEQUENCE: string[] = [
  'Item 28 (Group 5) — the official MAR submission letter from the Contractor (ITD) must be in place before the Consultant begins any review.',
  'Group 1 (Items 1–8) is reviewed first. If fixture certificates / LM-79 / LM-80 / TM-21 are incomplete, do not proceed to other groups.',
  'Acceptance / rejection is signed by a licensed Thai PE under PPS / PPS One Works (KM. 947/2569 · RTN_CSC 024/2569).',
]

export const DOCUMENT_QUALITY_RULES: string[] = [
  'All documents in English (or with a complete English translation).',
  'Certificates must state: certificate number, issue date, expiry date, issuing organisation.',
  'Test reports must identify: testing laboratory, report number, tested product model (matching the model proposed).',
  'Manufacturer declarations / brochure statements are not acceptable substitutes for test reports.',
  'Certificates must reference the latest applicable edition of the relevant standard; where a standard has been superseded, certification to an earlier edition is acceptable only with a documented gap analysis to the current edition.',
]

export const COLOUR_LEGEND: string =
  'grey/green = derived (do not edit); white = manual entry; blue underline = navigation link.'

export const DISCLAIMER: string =
  'This register is prepared per Section 28 01 00 and lessons from the OCEM review (MAR-AFL-0001-R1). It is an internal reference and communication tool, not a contractual document. Contractual matters are reviewed and verified by the legal department.'

/** Order the 14 detail-sheet items appear in the Item Details sidebar (§8.1). Single source of truth. */
export const DETAIL_SHEET_ORDER: number[] = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 25, 26, 27]

export interface WorkflowStatusDef {
  id: WorkflowStatus
  label: string
}

/**
 * The Phase Progress tab's manual, pre-submission workflow status — independent
 * of the checkbox-derived Status above (§6). Order drives the status dropdown.
 */
export const WORKFLOW_STATUS_DEFS: WorkflowStatusDef[] = [
  { id: 'Pending', label: 'Pending' },
  { id: 'Preparing', label: 'Preparing' },
  { id: 'AwaitingApproval', label: 'Awaiting Approval' },
  { id: 'Ready', label: 'Ready' },
  { id: 'Submitted', label: 'Submitted' },
]

export interface LifecyclePhaseDef {
  id: LifecyclePhase
  label: string
}

/**
 * The 7 real submission-lifecycle phases for Phase Progress (independent of
 * GroupId — see CLAUDE.md §7). Order drives the phase dropdown, the phase
 * cards, and the table's phase-grouping sections. "Unassigned" (item.phase
 * === undefined) is NOT one of these 7 — it's a distinct, separately-tracked
 * bucket so "Others" keeps meaning genuinely miscellaneous documents.
 */
export const LIFECYCLE_PHASE_DEFS: LifecyclePhaseDef[] = [
  { id: 'PreBidding', label: 'Pre-Bidding' },
  { id: 'Bidding', label: 'Bidding' },
  { id: 'AfterContract', label: 'After Contract' },
  { id: 'InstallationCommissioning', label: 'Installation & Commissioning' },
  { id: 'Warranty', label: 'Warranty' },
  { id: 'OperationMaintenance', label: 'Operation & Maintenance' },
  { id: 'Other', label: 'Others' },
]

export interface AdsbInstallPhaseDef {
  id: AdsbInstallPhase
  label: string
}

/** The ADS-B checklist's own 5-phase technical breakdown — independent of LifecyclePhase (§ types.ts). */
export const ADSB_INSTALL_PHASE_DEFS: AdsbInstallPhaseDef[] = [
  { id: 'DesignApproval', label: 'Phase A — Design & Approval Prerequisites' },
  { id: 'SiteReadiness', label: 'Phase B — Site Readiness & Safety' },
  { id: 'Installation', label: 'Phase C — Installation Workmanship' },
  { id: 'TestingCommissioning', label: 'Phase D — Testing & Commissioning' },
  { id: 'AsBuiltHandover', label: 'Phase E — As-built & Handover' },
]
