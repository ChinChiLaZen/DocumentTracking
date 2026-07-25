export type GroupId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5'

export type Priority = 'A' | 'B' | 'C'

export type Status =
  | 'Submitted' // all checks ticked
  | 'In Progress' // some checks ticked
  | 'Pending' // no checks ticked (or no detail sheet + manual default)
  | 'Needs Revision' // manual only
  | 'Not Available' // manual only

export interface Item {
  no: number // 1..28
  group: GroupId
  name: string
  standard: string
  requirement: string
  priority: Priority
  detailSheetId?: string // present only for the 14 items that have a detail sheet
  manualStatus?: Status // set ONLY when the reviewer overrides (§6.3)
  remark?: string // free text OR a derived template (Item 3, §6.5)
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
