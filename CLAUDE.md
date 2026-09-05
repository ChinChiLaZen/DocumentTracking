# CLAUDE.md — Document Tracking (MAR) Web App

> Persistent project brief and source of truth for Claude Code.
> Read this file at the start of every session before touching code.
> When a decision here proves wrong, update **this file** in the same PR — never let the code and this brief drift apart.

---

## 1. What we are building

An internal web app that replaces the Airsafe MAR tracking spreadsheet with a live, linked, click-to-tick interface — **multi-project since 2026-07-26**: a top-level Projects Summary page lists every MAR review in flight, and each project gets its own full Dashboard/Tracker/Priority/Item-Details/Guidelines tab set, keyed by `:projectId` in the route.

Every project tracks the documents a manufacturer must submit for **Vendor Approval / Material Approval Request (MAR)** against the same vendor-neutral 28-item / 14-detail-sheet checklist structure (§2.1). The first, real seeded project is:

- **Project:** Civil Works — Second Runway & Taxiway, U-Tapao International Airport
- **Scope:** Airfield Lighting, Section 28 01 00
- **Current vendor:** Airsafe Airport Equipment Co., Ltd.

A second, blank placeholder project ("Demo Project — Sample Vendor") ships alongside it so the multi-project list/routing is exercised before a real second project exists. New projects can also be created at runtime from the Projects Summary page ("Add Project"): they clone the same checklist structure, fully unticked.

The app must reproduce the behaviour of the spreadsheet it comes from: the **checkboxes on each Item detail sheet are the single source of truth**, and every roll-up, status, priority count and dashboard figure is *derived* from them — never entered twice. This holds per-project; no data is ever shared or aggregated across projects.

Two Lovable prototypes define the target UI:
- Dashboard + overall tab shell → `https://pattern-to-page-pal.lovable.app/`
- Item Details tab → `https://check-chime-charm.lovable.app/`

This is an **internal review tool**, not a public site. It is a reference and communication aid, **not a contractual document** (surface that disclaimer in the Guidelines tab).

---

## 2. Non-negotiable domain rules

These come from the MAR process and must be encoded in the app, not just displayed:

1. **Vendor-neutral, evidence-based.** The same evaluation standard applied to the OCEM review (`ITD-MAR-AFL-0001-R1`) applies to every vendor. Manufacturer declarations / brochure statements are **not** a substitute for test reports or certificates.
2. **Critical sequence (enforced ordering shown on Dashboard + Guidelines):**
   1. Item 28 (Group 5) — the official MAR submission letter from the Contractor (ITD) must be in place **before** the Consultant begins any review.
   2. Group 1 (Items 1–8) is reviewed **first**. If fixture certificates / LM-79 / LM-80 / TM-21 are incomplete → do **not** proceed to other groups.
   3. Acceptance / rejection is signed by a licensed Thai PE under PPS / PPS One Works (KM. 947/2569 · RTN_CSC 024/2569).
3. **Status is derived, not authored.** For any item that has a detail sheet, its status is computed from the checkboxes (see §6). A reviewer may still override (e.g. "Needs Revision"); the app must make an override explicit and reversible (§6.3).
4. **Do not invent standards or figures.** The app only stores and displays what the reviewer ticks. No auto-filling of technical values.

---

## 3. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Build tool | **Vite** | matches the Lovable prototypes; fast, no SSR needed for an internal tool |
| Language | **TypeScript**, `strict: true` | no `any` in committed code |
| UI | **React 18** (function components + hooks) | |
| Styling | **Tailwind CSS** | tokens in §9 |
| Components | **shadcn/ui** (Radix under the hood) | Table, Checkbox, Badge, Tabs, Progress, Card, ScrollArea, Dialog, Tooltip, Input, Label, Select |
| Icons | **lucide-react** | |
| State | **Zustand** | one store; all derived values are selectors, never stored |
| Routing | **react-router-dom** | `/` = Projects Summary; one tab per route nested under `/projects/:projectId/...` (§7) |
| Persistence | **Postgres (Vercel/Neon), shared across every signed-in user**, behind a `PersistencePort` interface (§10) — migrated off per-browser `localStorage` 2026-08-04 | do not hard-code `fetch('/api/projects/...')` calls in components; go through `useTrackerStore`/`useActiveProject` |
| Auth | **Custom** email+password (`api/auth/*` Vercel Serverless Functions + Vercel Postgres), added 2026-07-31 | bcrypt-hashed passwords, JWT session in an httpOnly cookie, invite-code-gated signup; gates `AppShell` via a session check — see §10. Third custom-built iteration of auth this session: Clerk (removed — production requires a domain the deployer controls DNS for, blocking a plain `*.vercel.app` deploy) → Supabase (dropped per explicit request to not depend on a third-party auth vendor) → this |
| Tests | **Vitest** + **@testing-library/react** | derived-value logic in §6 must be unit-tested |
| Lint/format | ESLint + Prettier | |

> If this app is later folded into the WorkOS Next.js codebase, only the routing, persistence and build layers change — §5 (data model) and §6 (derived logic) are portable as-is. Keep them framework-free (plain TS modules).

---

## 4. Repository structure

```
api/
  auth/
    signup.ts                # POST — invite-code + email/password → bcrypt hash, inserts user, sets session cookie
    login.ts                 # POST — verifies password, sets session cookie
    logout.ts                # POST — clears session cookie
    session.ts               # GET  — verifies session cookie, returns { user } or 401
  projects/
    index.ts                 # GET /api/projects (list); PUT/DELETE /api/projects?id=X (upsert incl. seed / admin-only delete) — one file, ?id= not a path segment (§10 — catch-all files don't work here)
  tasks/
    index.ts                 # GET/POST /api/tasks (list/create); PATCH/DELETE /api/tasks?id=X — merged from a separate tasks/[id].ts 2026-08-29 to free a route slot for cron/daily-digest.ts under the 12-function cap (§10)
  cron/
    daily-digest.ts           # GET /api/cron/daily-digest, Vercel Cron-only (CRON_SECRET bearer check) — added 2026-08-29, see §10's Daily digest cron note
  _lib/
    db.ts                    # @vercel/postgres `sql`, ensureSchema() (idempotent CREATE TABLE IF NOT EXISTS)
    auth.ts                  # password hashing, JWT sign/verify, cookie helpers, requireAdmin (§10)
    validateProjectRecord.ts # shallow ProjectRecord shape validator — can't deep-validate against src/data/types.ts (api/ can't import src/**)
    rollup.ts                 # shallow re-implementation of domain/derive.ts's checksRequired/checksDone/effectiveStatus, for api/cron/daily-digest.ts only (api/ can't import src/**)
src/
  data/
    checklistTemplate.ts     # vendor-neutral 28 items + 14 detail sheets, blank (§5.4)
    aotTemplate.ts           # real 94-item AOT bid-submission checklist, blank instance data (§5.4a)
    aotTemplate.test.ts      # locks the 94-item / 38-20-6-30 phase-split invariants
    doaTemplate.ts           # real 64-item DOA 3-airport document tracker, blank instance data (§5.4b)
    doaTemplate.test.ts      # locks the 64-item / 17-17-15-15 site-split + 12-21-31 docType-split invariants
    initialProjects.ts       # the 2 seeded ProjectRecords (real U-Tapao data + blank demo), templateKind:'mar'
    csiMasterFormat.ts       # CSI MasterFormat divisions + sections for the "Project Type" picker — generated from masterfile/*.xlsx, see below
    types.ts                 # domain types incl. ProjectMeta/ProjectRecord (§5.1–5.3)
  domain/
    derive.ts                # ALL derived-value logic (§6) — pure, framework-free
    derive.test.ts           # unit tests locking the numbers in §6.4
    rules.ts                 # priority defs, group defs, status enum, guideline text
    schedule.ts               # Project Management tab's date-math (§5.3c) — pure, framework-free, unrelated to §6
    schedule.test.ts          # unit tests for schedule.ts
    boq.ts                    # BOQ Estimate tab's line/category/VAT math (§5.3d) — pure, framework-free
    boq.test.ts               # unit tests for boq.ts
  store/
    useTrackerStore.ts       # Zustand store, multi-project (projects/projectOrder) + selectors
    useActiveProject.ts      # resolves :projectId, pre-curries store actions for pages
    useAuthStore.ts          # Zustand store wrapping fetch calls to api/auth/* (§10)
    persistence.ts           # PersistencePort + Postgres-backed adapter (createApiPersistence) + memory adapter for tests (§10)
  components/
    auth/
      AuthPage.tsx            # /auth route — sign in / create account (email+password only, no OAuth)
      UserMenu.tsx            # signed-in email + Sign out, used in both page headers
    layout/
      AppShell.tsx           # hydrate() + session gate via api/auth/session (§10)
      ProjectShell.tsx       # project header + tab nav (MAR_TABS/AOT_TABS) + not-found gate (§7)
      ProjectIndexPage.tsx   # index-route switch: DashboardPage (MAR) vs PhaseDashboardPage (AOT)
    projects/
      ProjectsSummaryPage.tsx # post-login Dashboard: cross-project stat row + list of all projects
      DashboardStatCards.tsx  # cross-project stat cards, driven by selectDashboardStats (§10)
      AddProjectDialog.tsx    # create-project form (clones checklistTemplate) — visible to Admin/Project Manager only (§10)
      EditProjectDialog.tsx   # edit title/vendor/scope/projectType/preparedDate on an existing project — Admin/Project Manager only (§10)
      DeleteProjectDialog.tsx # Admin-only (§10)
    phase/                   # Phase Progress tab (§7) — additive, independent of §6
      PhaseDashboardPage.tsx
      PhaseCards.tsx
      PhaseItemsTable.tsx
      PhaseHeaderRow.tsx      # table section header — phase label only, no item-range text
      HistoryDialog.tsx
      CriticalCutoffBanner.tsx
    schedule/                # Project Management tab (§7, §5.3c) — added 2026-08-29, additive, independent of §6
      ProjectManagementPage.tsx # container: contract-start date, Add Phase/Milestone buttons, dialogs
      GanttChart.tsx           # pure presentational — phase bars + milestone markers + list
      PhaseFormDialog.tsx      # add/edit a SchedulePhase — remounted via `key` per open, not a resync effect
      ActivityFormDialog.tsx   # add/edit a PhaseActivity under a specific phase — remounted via key per open, same pattern
      MilestoneFormDialog.tsx  # add/edit a ScheduleMilestone — same remount-via-key pattern
    boq/                     # BOQ Estimate tab (§7, §5.3d) — added 2026-09-05, additive, independent of §6
      BoqEstimatePage.tsx      # container: category tabs, line table, Add Category/Add Item, Export
      BoqSummaryCard.tsx       # subtotal/VAT/net total + per-category share breakdown
    dashboard/…
    tracker/…
    priority/…
    itemDetails/…            # §8 — the focus tab
    guidelines/…
    ui/…                     # shadcn components
  routes.tsx
  main.tsx
docs/
  CLAUDE.md                  # this file
```

---

## 5. Data model

### 5.1 Enums / unions

```ts
type GroupId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
type Priority = 'A' | 'B' | 'C';
type Status =
  | 'Submitted'        // ✅  all checks ticked
  | 'In Progress'      // 🔄  some checks ticked
  | 'Pending'          // ⏳  no checks ticked (or no detail sheet + manual default)
  | 'Needs Revision'   // ⚠️  manual only
  | 'Not Available';   // ❌  manual only

// Phase Progress tab (added 2026-07-26) — a separate, manually-set pipeline
// status. Independent of Status above: never wired into effectiveStatus,
// autoStatus, or rollup() in domain/derive.ts.
type WorkflowStatus = 'Pending' | 'Preparing' | 'AwaitingApproval' | 'Ready' | 'Submitted';

// Phase Progress tab (real taxonomy added 2026-07-26) — the airport-project
// document lifecycle. Independent of GroupId (a technical document category,
// e.g. "Fixture Certificates") — has no relationship to it. Reviewer-assigned
// per item, blank ("Unassigned") by default. 'Other' is a genuine, distinct
// phase for miscellaneous documents — Unassigned is represented by
// item.phase === undefined, never by 'Other'.
type LifecyclePhase =
  | 'PreBidding'               // "Pre-Bidding"
  | 'Bidding'                  // "Bidding"
  | 'AfterContract'            // "After Contract"
  | 'InstallationCommissioning'// "Installation & Commissioning"
  | 'Warranty'                 // "Warranty"
  | 'OperationMaintenance'     // "Operation & Maintenance"
  | 'Other';                   // "Others"

// Which checklist template a project was built from (added 2026-07-27, 'doa' added
// same day). 'mar' = the original U-Tapao-style 28-item checkbox register —
// group/priority/detail sheets all apply. 'aot' = the real Airports of Thailand
// 94-item bid-submission checklist — no groups/priority/detail sheets at all
// (see AotImportance + §7). 'doa' = the real Department of Airports 64-item
// document tracker spanning 3 airports (see DoaDocType/DoaSite + §5.4b).
type TemplateKind = 'mar' | 'aot' | 'doa';

// AOT's own criticality marker (⚠️สำคัญ/ปกติ/📌ประกอบ/ด่านสำคัญ) — independent
// of Priority (A/B/C), which is MAR-specific and doesn't apply to AOT items.
type AotImportance = 'Critical' | 'Normal' | 'Supporting' | 'CriticalCheckpoint';

// DOA's own document classification badge (🟢ใช้ร่วม/🔴บังคับ/🔵เฉพาะสถานที่) —
// independent of AotImportance/Priority, which don't apply to DOA items.
type DoaDocType = 'Shared' | 'Mandatory' | 'SiteSpecific';

// Which of the DOA tracker's 3 airports (or all of them) an item applies to.
type DoaSite = 'Shared' | 'KKC' | 'UTH' | 'URT';
```

### 5.2 Item (the register rows — 28 for MAR, 94 for AOT, 64 for DOA; shared shape across templates)

```ts
interface Item {
  no: number;                     // 1..28 for MAR; 1..94 for AOT; 1..64 for DOA (see `code` for AOT/DOA's real identifier)
  group?: GroupId;                // MAR only — technical document category. Optional: AOT/DOA items set none.
  name: string;                   // MAR: "Technical Datasheet / Product Catalogs — All Fixture Types". AOT: Thai item description. DOA: Thai document description.
  standard: string;               // MAR: standard/clause, e.g. "Clause 1.4.O...". AOT: clause reference, e.g. "ข้อ 2.1-2.3". DOA: source folder path, e.g. "00_SHARED/01_Company_Qualifications"
  requirement: string;            // MAR: acceptance criteria. AOT: deadline-stage label, e.g. "ก่อนยื่นข้อเสนอ". DOA: the real filename, e.g. "G1-REG_Company_Registration_Certificate.pdf"
  priority?: Priority;            // MAR only — A/B/C. Optional: AOT/DOA items set none (see `importance`/`docType` instead).
  detailSheetId?: string;         // present only for the 14 MAR items that have a detail sheet — AOT/DOA items never have one
  manualStatus?: Status;          // set ONLY when the reviewer overrides (§6.3); items w/o a detail sheet use this
  remark?: string;                // free text OR a derived template (Item 3, §6.5)
  // AOT/DOA-only fields (§7) — absent for MAR items.
  code?: string;                  // AOT/DOA's real identifier, e.g. "P0-S1-01" or "G1-REG" — shown instead of `no` when present
  importance?: AotImportance;     // AOT only
  docType?: DoaDocType;           // DOA only — the Shared/Mandatory/Site-specific badge
  site?: DoaSite;                 // DOA only — which of KKC/UTH/URT (or all 3, 'Shared') the item applies to
  // Phase Progress tab fields (§7) — blank by default for every seeded project; only reviewer input populates them.
  workflowStatus?: WorkflowStatus;
  phase?: LifecyclePhase;         // undefined = Unassigned, distinct from the real 'Other' phase
  documentDate?: string;          // ISO yyyy-mm-dd
  expiryDate?: string;            // ISO yyyy-mm-dd
  responsiblePerson?: string;
  documentLink?: string;
}
```

### 5.3 Detail sheet (the checkbox matrices)

A detail sheet is a set of **rows**, each row having one or more **checkable cells**. Column headers vary per item.

```ts
interface CheckColumn { key: string; label: string; }   // e.g. { key: 'model', label: 'Model No. / Ordering Ref.' }

interface CheckRow {
  id: string;
  article?: string;               // "2.6"  (TOR article; may be blank for "missing in TOR" rows)
  description: string;            // "Approach Elevated Lights"
  cells: Record<string, boolean>; // keyed by CheckColumn.key
  remark?: string;                // "Rev.0 - 20260725"
  section?: string;               // optional sub-heading, e.g. "Missing Item in TOR but stated in DWG"
}

interface DetailSheet {
  id: string;                     // "item-1"
  itemNo: number;
  title: string;                  // "Technical Datasheet / Product Catalogs"
  applicable: string;             // standard string echoed in the sheet header
  columns: CheckColumn[];         // the checkable columns for THIS sheet
  rows: CheckRow[];
}
```

### 5.3a Project (added 2026-07-26 — multi-project support)

```ts
interface ProjectMeta {
  id: string;
  title: string;        // "Civil Works — Second Runway & Taxiway, U-Tapao International Airport"
  scope: string;         // "Airfield Lighting, Section 28 01 00"
  vendor: string;        // "Airsafe Airport Equipment Co., Ltd."
  preparedDate: string;  // ISO yyyy-mm-dd
  templateKind?: TemplateKind; // optional for backward-compat with pre-existing persisted data; absent = 'mar'
  projectType?: string; // CSI MasterFormat section code, e.g. "26 51 13" — see csiMasterFormat.ts note below. Optional; absent for pre-existing projects or left unset at creation
}

interface ProjectRecord {
  meta: ProjectMeta;
  items: Item[];
  sheets: DetailSheet[];
  history: HistoryEntry[];        // Phase Progress audit log (§7) — append-only, project-scoped
}
```

Every project uses the same 28-item / 14-detail-sheet checklist structure (§2.1: the evaluation standard is vendor-neutral) — only tick state, manual overrides and remarks differ per project. That structure lives once in `checklistTemplate.ts`; a brand-new project (via "Add Project") clones it with every cell `false`, no overrides, no remarks.

### 5.3b History entry (Phase Progress audit log, added 2026-07-26)

```ts
type HistoryField = 'workflowStatus' | 'phase' | 'documentDate' | 'expiryDate' | 'responsiblePerson' | 'documentLink';

interface HistoryEntry {
  id: string;
  timestamp: string;             // ISO datetime
  itemNo: number;
  field: HistoryField;
  from: string | undefined;
  to: string | undefined;
  changedBy: string;             // signed-in reviewer's email (custom auth session), passed in by the caller — never read inside the store
}
```
One entry is appended per **actually-changed** field (no-op writes, e.g. re-picking the same value, are skipped). `resetToSeed` clears a project's `history` back to `[]` along with its workflow status/metadata.

### 5.3c Project schedule (Project Management tab, added 2026-08-29)

```ts
type MilestoneType = 'Delivery' | 'Committee' | 'Extension' | 'Other';

interface PhaseActivity {
  id: string;
  name: string;
  startDate: string;         // ISO yyyy-mm-dd
  endDate: string;           // ISO yyyy-mm-dd
  percentComplete: number;   // 0-100, manual, reviewer-entered
  weightPercent?: number;    // 0-100, manual — this activity's share of its PARENT PHASE
                              // (not the whole project), same two-axis pattern one level down.
}

interface SchedulePhase {
  id: string;
  name: string;             // e.g. "Phase 4 (DM)"
  code?: string;             // optional short code, e.g. "DM"
  startDate: string;         // ISO yyyy-mm-dd
  endDate: string;           // ISO yyyy-mm-dd
  percentComplete: number;   // 0-100, manual, reviewer-entered — never derived
  weightPercent?: number;    // 0-100, manual — this phase's share of the total project
                              // (a "payment milestone" weight, e.g. งวดงาน 15%/70%/10%/5%),
                              // independent of percentComplete — same two-axis pattern as
                              // AotImportance vs Priority. Optional for backward-compat;
                              // treated as 0 by totalWeightPercent (domain/schedule.ts).
  activities?: PhaseActivity[]; // work-breakdown sub-tasks, always rendered as indented
                              // sub-rows (no expand/collapse) — added 2026-09-02.
}

interface ScheduleMilestone {
  id: string;
  label: string;
  date: string;              // ISO yyyy-mm-dd
  type: MilestoneType;
}

interface ProjectSchedule {
  phases: SchedulePhase[];
  milestones: ScheduleMilestone[];
  contractStartDate?: string; // ISO yyyy-mm-dd — dashed reference line on the timeline
}
```
`ProjectRecord.schedule?: ProjectSchedule` — optional for backward-compat with rows that predate this field (`toRuntime()`/`hydrate()` default a missing value to `{ phases: [], milestones: [] }`, same posture as `templateKind`/`projectType`). Generic project-scheduling data, **independent of checklist structure** — shown for every `TemplateKind` alike (unlike Tracker/Priority/Item Details, which are MAR-only). `percentComplete` is manual, reviewer-entered — there is no checkbox/derived source for it, unlike §6's checklist-item statuses. No audit trail: `HistoryField`/`HistoryEntry` are keyed by `itemNo` and don't fit phase/milestone edits, so schedule changes aren't logged. `resetToSeed` also clears `schedule` back to `{ phases: [], milestones: [] }`, consistent with `history`. Add/Edit/Delete phase and milestone are gated to `admin`/`ProjectManager` roles, **client-side only** — same accepted-risk posture as Add/Edit Project (§10). The date-math for positioning phase bars/milestones/month ticks on the timeline lives in `domain/schedule.ts` (pure, framework-free, unrelated to §6's `derive.ts`). `weightPercent` (added 2026-08-30, modeled on `project-joy-gantt.lovable.app/apron`'s per-installment งวดงาน percentages) is a second, independent manual axis — a phase's share of the *whole project's* value/scope, not its completion progress. `domain/schedule.ts`'s `totalWeightPercent()` sums it across a project's phases (unset treated as 0); the Project Management tab shows the running total against 100% (`GanttChart.tsx`'s banner — emerald at exactly 100%, amber under, rose over), same as the reference site's "รวมครบ 100% แล้ว" total row. Nothing enforces the 100% total server-side — it's advisory, like the rest of §5.3c's client-side-only posture. `activities` (added 2026-09-02) is a work-breakdown structure one level below phases — each `SchedulePhase` optionally carries a list of `PhaseActivity` sub-tasks, each with its own `startDate`/`endDate`/`percentComplete`/`weightPercent` pair scoped to *that phase* (not the whole project). Activities always render as indented sub-rows under their phase on the Gantt chart and in the Excel export — no expand/collapse toggle exists. `domain/schedule.ts`'s `totalActivityWeightPercent(phase)` sums one phase's activities the same way `totalWeightPercent(phases)` sums project-wide phase weights, and `GanttChart.tsx` shows a per-phase running-total indicator alongside the existing project-wide banner. Like phases/milestones, activities carry no audit trail and their 100% total is advisory only, enforced nowhere server-side (`api/_lib/validateProjectRecord.ts` only checks `activities` is an array when present, same shallow posture as `phases`/`milestones`).

### 5.3d BOQ Estimate (`boq`, added 2026-09-05)

```ts
interface BoqLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;               // short text, e.g. "set", "m", "ea"
  materialUnitCost: number;
  laborUnitCost: number;
}

interface BoqCategory {
  id: string;
  name: string;                // e.g. "Category 1" — user-renamable
  lines: BoqLine[];
}

interface BoqEstimate {
  categories: BoqCategory[];
  vatPercent: number;          // default 7, editable
}
```
`ProjectRecord.boq?: BoqEstimate` — optional for backward-compat with rows that predate this field (`toRuntime()`/`hydrate()` default a missing value to `{ categories: [], vatPercent: 7 }`, same posture as `schedule`). Generic project-costing data, **independent of checklist structure** — shown for every `TemplateKind` alike, same posture as Project Management (§5.3c). Modeled on a reference site (`quick-boq-form.lovable.app`, styled after the real ปร.4/ปร.5 Thai government BOQ forms) for **structural format only** — categories-as-tabs, per-line `quantity × (materialUnitCost + laborUnitCost)` math, VAT calc, category-share breakdown — its placeholder item content is never reproduced, so a new project's `boq` always starts as `{ categories: [], vatPercent: 7 }`, the same "start empty" posture as `schedule`'s `{ phases: [], milestones: [] }`. Category/line numbering (`"1.1"`, `"2.3"`) is derived at render time from array order, never stored. `domain/boq.ts` (pure, framework-free, unrelated to §6) provides `lineTotal`/`categoryTotal`/`summarizeBoq` (subtotal, VAT amount, net total, and each category's % share of the pre-VAT subtotal). Add/Edit/Delete category and line, and the VAT % field, are gated to `admin`/`ProjectManager` roles, **client-side only** — same accepted-risk posture as Schedule (§5.3c) and Add/Edit Project (§10); unlike Schedule's per-button gating, the whole BOQ tab is read-only end-to-end for other roles (every numeric input is `disabled={!canEdit}`), not just its Add/Delete actions. No audit trail — same reasoning as §5.3c (`HistoryField`/`HistoryEntry` are keyed by `itemNo` and don't fit category/line edits). `resetToSeed` also clears `boq` back to `{ categories: [], vatPercent: 7 }`, consistent with `schedule`/`history`. Category color (tab accent, category-share progress bar, Excel category-cell fill) reuses `PHASE_COLOR_SLOTS`/`phaseColorIndex` (`statusStyles.ts`/`domain/schedule.ts`) via `phaseColorIndex(category.id)` — same palette and hashing utility Project Management uses for phases, for a stable per-id color with zero new palette code; **not** a claim that BOQ categories and Schedule phases are the same underlying entity, since the two features have entirely unrelated id spaces.

### 5.4 Seed data (`checklistTemplate.ts` + `initialProjects.ts`)

Ship the full register as typed seed data. Exact shape below — **these counts are load-bearing; the tests in §6.4 assert them.**

**Groups & priorities**

| Group | Items | | Priority | Items | Count |
|---|---|---|---|---|---|
| G1 | 1–8 | | A | 1–10, 28 | 11 |
| G2 | 9–12 | | B | 11–24 | 14 |
| G3 | 13–21 | | C | 25–27 | 3 |
| G4 | 22–27 | | | **Total** | **28** |
| G5 | 28 | | | | |

**The 14 detail sheets** (items 8, 13–24 and 28 have **no** detail sheet — they are manual-status only):

| Item | Title | Check columns | Rows | Checks |
|---|---|---|---|---|
| 1 | Technical Datasheet / Product Catalogs | Model, Rating, Dimension, Material, Photometric (5) | 19 | 95 |
| 2 | Third-Party Certificates | Third-Party Certificate (1) + 1 "summary table" row | 20 | 20 |
| 3 | FAA ALECP Listing (AC 150/5345-53 Addendum) | FAA ALECP Listing (1) | 25 | 25 |
| 4 | Complete LM-79 Test Reports | LM-79 (1) | 19 | 19 |
| 5 | LM-80 Test Reports & TM-21 Evaluation Reports | LM-80, TM-21 (2) | 19 | 38 |
| 6 | Dimming Curve Data per FAA EB-67 | Dimming Curve (1) | 19 | 19 |
| 7 | Corrosion Test Report | Corrosion Report (1) | 19 | 19 |
| 9 | Isolation Transformer | Datasheet, Test Cert, Type Test (3) | 1 | 3 |
| 10 | RCMU / SLC (Lamp Control Unit) | Tech Spec, PLC Protocol, Type Test, Evidence (4) | 1 | 4 |
| 11 | Fixture Base, Connector Kits & Accessories | Specification, Reference Std / Test Cert (2) | 8 | 16 |
| 12 | CCR-I Test Reports for Missing Sizes / Ratings | Specification, Reference Std / Test Cert (2) | 9 | 18 |
| 25 | Project References & Letter of Acceptance | Project Refs, Letter of Acceptance (2) | 1 | 2 |
| 26 | Appointment Letter — Distributor / Service Provider | Authorized Distributor, Service Provider (2) | 1 | 2 |
| 27 | O&M Manuals & Training Program | O&M Manuals, Training Program (2) | 1 | 2 |
| | | | **Total** | **282** |

`checklistTemplate.ts` holds the vendor-neutral structure above with every cell blank (`remark: ''`). Every item's `phase` defaults to `'AfterContract'` (confirmed real data, added 2026-07-26 — the MAR checklist structure is inherently a post-contract-award submittal process, never a per-vendor guess; see §7's Lifecycle Phase note). `initialProjects.ts` supplies the two projects shipped with the app:

- **U-Tapao / Airsafe** (`UTAPAO_PROJECT_ID`) — the real tick state from the spreadsheet (initial: **120 of 282 ticked ≈ 43%**). Row descriptions and article numbers per detail sheet are carried verbatim from the workbook. Every row's `remark` seeds to `"Rev.0 - 20260725"`.
- **Demo Project — Sample Vendor** (`DEMO_PROJECT_ID`) — a plain clone of the blank template (0 of 282 ticked), so multi-project list/routing behavior is visibly exercised before a real second project exists.

Projects created later via the "Add Project" UI first pick a **Template** (MAR or AOT — see below). For MAR, it clones the same blank template as the demo project; the dialog also asks for a **Default phase** (`LIFECYCLE_PHASE_DEFS`, labeled "Phase 1 — Pre-Bidding" … "Phase 7 — Others"; preselected to "Phase 3 — After Contract") — the chosen phase is applied to every one of the new project's 28 items, since not every future MAR-shaped project is necessarily a post-contract register like U-Tapao's.

### 5.4a AOT template (`aotTemplate.ts`, added 2026-07-27 — real data)

The real Airports of Thailand 94-item bid-submission checklist, transcribed verbatim from the RSMS reference system (`clean-list-it.lovable.app` — Suvarnabhumi Airport, AOT PCL, Bid No. 6RP10-691062), extracted via full-page-text capture and verified against the site's own phase totals:

| Phase | LifecyclePhase | Items |
|---|---|---|
| Phase 0 — คุณสมบัติ & เตรียมยื่นข้อเสนอ | `PreBidding` | 38 |
| Phase 1 — ยื่นประมูล | `Bidding` | 20 |
| Phase 2 — หลังลงนามสัญญา | `AfterContract` | 6 |
| Phase 3 — ติดตั้ง ทดสอบ ส่งมอบ | `InstallationCommissioning` | 30 |
| | **Total** | **94** |

Each item carries a real `code` (e.g. `"P0-S1-01"`), `name` (Thai description), `standard` (clause reference), `requirement` (deadline-stage label), and `importance` (`AotImportance`) — no `group`, `priority`, or `detailSheetId`. **Only the structural content is real** — live tick/status state on the reference site could not be reliably attributed per-item, so every AOT item starts fully blank (`workflowStatus`/dates/responsible/link all `undefined`), same treatment as the blank MAR template. `AOT_CRITICAL_NOTICE` holds the real "จุดตัดสิทธิ์สำคัญ" eligibility-cutoff paragraph (Phase 0/POC disqualification rule), shown by `CriticalCutoffBanner` in place of `CRITICAL_SEQUENCE` on AOT projects. Locked invariants (94 items, 38/20/6/30 split) are asserted in `aotTemplate.test.ts`.

### 5.4b DOA template (`doaTemplate.ts`, added 2026-07-27 — real data)

The real Department of Airports 64-item document tracker, transcribed verbatim from the reference system (`paper-pathfinder-pal.lovable.app` — "ระบบติดตามเอกสาร — 3 ท่าอากาศยาน KKC · UTH · URT", spanning Khon Kaen, Udon Thani and Surat Thani airports), extracted via full-page-text capture and verified against the site's own docType totals:

| Site | DoaSite | Items |
|---|---|---|
| 00_SHARED (all 3 airports) | `Shared` | 17 |
| 01_KKC (Khon Kaen) | `KKC` | 17 |
| 02_UTH (Udon Thani) | `UTH` | 15 |
| 03_URT (Surat Thani) | `URT` | 15 |
| | **Total** | **64** |

| DocType badge | DoaDocType | Items |
|---|---|---|
| 🟢 ใช้ร่วม (Shared) | `Shared` | 12 |
| 🔴 บังคับ (Mandatory) | `Mandatory` | 21 |
| 🔵 เฉพาะสถานที่ (Site-specific) | `SiteSpecific` | 31 |

`site` (which airport an item applies to — its source folder) and `docType` (an independent classification badge shown per item) are **not the same axis** — e.g. item `G1-BLK` lives in the shared `00_SHARED` folder (`site: 'Shared'`) but carries the `Mandatory` badge, not `Shared`. Both are transcribed verbatim, never inferred.

Each item's real `G1`/`G2`/`G3` prefix (its source-folder phase group — Tender / Post-Contract / Handover) maps onto 3 of our existing 7 `LifecyclePhase` values, same reuse pattern as AOT: G1 (Phase1_Tender) → `Bidding` (33 items), G2 (Phase2_PostContract) → `AfterContract` (12 items), G3 (Phase3_Handover) → `InstallationCommissioning` (19 items). No new phase values needed. `DOA_SITE_LABEL` (in `doaTemplate.ts`) supplies the display label for each `DoaSite`, matching the reference site's "KKC · UTH · URT" chip for shared items.

**Only the structural content is real** — same treatment as AOT: every DOA item starts fully blank (`workflowStatus`/dates/responsible/link all `undefined`). The reference site's own dashboard cards show unrelated demo-only status counts ("กำลังดำเนินการ 4", "พร้อม 0") that don't correspond to a per-item verifiable state — these were **not** transcribed, since CLAUDE.md's "never fabricate tick state" rule applies equally to DOA's real workflow state, not just AOT's.

The DOA reference tracker has **no equivalent "critical cutoff" notice** to transcribe (unlike AOT's `AOT_CRITICAL_NOTICE` or MAR's `CRITICAL_SEQUENCE`) — `PhaseDashboardPage` simply omits the `CriticalCutoffBanner` for `templateKind === 'doa'` projects rather than inventing one. Locked invariants (64 items, 17/17/15/15 site split, 12/21/31 docType split, 33/12/19 phase split) are asserted in `doaTemplate.test.ts`.

Same registry pattern (a template module + a `TemplateKind` case) applies to any future template.

### 5.4c CSI MasterFormat project-type list (`csiMasterFormat.ts`, added 2026-07-31 — real data)

`ProjectMeta.projectType` (§5.3a) is a free-standing classification field on Add Project — independent of `TemplateKind`/`GroupId`/checklist structure, never wired into derived logic. Its option list (`CSI_DIVISIONS`, `CSI_MASTER_FORMAT`) is generated from `masterfile/CSI_MasterFormat_Division_Map_and_Sections.xlsx` (not committed — a local reference file; ask the user for it again if regenerating), specifically its "Division Map" sheet (50 divisions 00–49, Thai+English titles) and "Sections " sheet (226 sections after cleanup, e.g. `26 51 13`). This **superseded a hand-transcribed list** built the same day from a pasted CSI reference before the actual spreadsheet was available — the spreadsheet is authoritative.

Two source-data issues were resolved during generation, not silently ignored:
- One duplicate section code in the source (`34 77 63`, two different section names — "Visual Docking Guidance System (VDGS)" vs. "Advanced ...") — the first occurrence was kept, the second dropped, rather than inventing a disambiguated code.
- One row's own "Div." column disagreed with its section code's division prefix (`27 51 16` tagged `Div.=21`) — the code prefix was trusted, since it's what was actually corrected in that revision of the source; the Div./category columns just weren't updated to match.

`groupCsiByDivision()` labels each `<SelectGroup>` from `CSI_DIVISIONS` (the authoritative Division Map) rather than inferring a label from any one section row — every division gets a real title even if it has zero sections in the list (e.g. the "Reserved for Future Expansion" divisions).

---

## 6. Derived-value logic (`domain/derive.ts`)

This is the heart of the app. **Pure functions, no React, fully unit-tested.** Components read these through store selectors — they never recompute inline.

### 6.1 Per detail sheet

```
checksRequired(sheet) = total number of cells across all rows        // COUNTA
checksDone(sheet)     = number of cells === true                     // COUNTIF TRUE
percent(sheet)        = checksRequired === 0 ? 0 : checksDone / checksRequired
```

### 6.2 Auto status from checkboxes

```
autoStatus(sheet):
  if checksRequired === 0 → undefined
  if checksDone >= checksRequired → 'Submitted'
  if checksDone > 0 → 'In Progress'
  else → 'Pending'
```

### 6.3 Effective status shown on Tracker / Priority / Dashboard

```
effectiveStatus(item):
  if item.manualStatus is set → item.manualStatus        // reviewer override (incl. items w/o a detail sheet)
  else if item has a detail sheet → autoStatus(sheet)
  else → 'Pending'
```

- Ticking a checkbox updates `autoStatus` immediately; every dependent view re-renders.
- An override is set **only** by explicit reviewer action and is visibly flagged ("MANUAL"). Clearing the override returns the row to auto. Never silently overwrite ticks with a manual status or vice-versa.

### 6.4 Roll-ups (Dashboard) — lock these in tests

```
totalItems            = 28
byStatus[s]           = count of items where effectiveStatus === s
byPriority[p].total   = count of items with priority p           // A:11  B:14  C:3
byPriority[p].done    = count where priority p AND status 'Submitted'
checkboxRollup.req    = Σ checksRequired over the 14 sheets       // 282
checkboxRollup.done   = Σ checksDone over the 14 sheets           // seed: 120
integrityOK           = totalItems === Σ byPriority.total === Σ byStatus   // must be true
```

`derive.test.ts` must assert: priority totals `{A:11,B:14,C:3}`, checkbox total `282`, seed done `120`, and `integrityOK === true`.

### 6.5 Item 3 remark is generated, never hand-typed

```
item3.remark = `FAA ALECP listing confirmed for ${done} of ${required} listed line items. `
             + `Remaining fixture types, connector kits, isolating transformers, CCR, light bases and ALCMS outstanding.`
```
So the sentence can never drift from the tick count (this fixed a real "6 of 18" vs actual-5 mismatch in the spreadsheet).

---

## 7. Tabs / routes

`/auth` (`AuthPage.tsx`, §10) is the only route outside the session gate — sign in / create account (invite-code required). Every other route is nested under `AppShell`, which redirects to `/auth` when signed out. `/` is the post-login **Dashboard** landing page (`ProjectsSummaryPage.tsx`, no header band, no tabs), added 2026-07-31 — a cross-project stat row (`DashboardStatCards.tsx` / `selectDashboardStats`: Projects, Total Items, Submitted, Overall Progress — plain sums of the same per-project `{done,total}` figures already on each card below, never a separately-computed number) plus the project card grid (title, vendor, scope, compact rollup) and "Add Project" and `UserMenu` (signed-in email + Sign out). Opening a project navigates to `/projects/:projectId`, which renders the project's own header (title/scope/vendor/prepared date, a "← All Projects" link, Reset-to-seed, `UserMenu`) and a tab bar that **depends on `meta.templateKind`** (`ProjectShell.tsx`'s `MAR_TABS` vs `AOT_TABS`). The table below is the **MAR** tab set (`templateKind` absent or `'mar'`); AOT-shaped projects (`templateKind === 'aot'`) get a **single "Dashboard" tab only** — see the AOT note after the table. The index route itself (`ProjectIndexPage.tsx`) renders `DashboardPage` for MAR or `PhaseDashboardPage` for AOT. Routes nested under `/projects/:projectId`:

| Route | Tab | Content |
|---|---|---|
| `/projects/:projectId` (index) | **Dashboard** | Overview cards (Total 28, Submitted, In Progress, Pending, Needs Revision, Not Available), Overall Submission %, Checkbox Roll-up %, By-Priority table, Critical Sequence list, Quick Navigation, integrity line |
| `/projects/:projectId/tracker` | **Tracker** | Master register: all 28 rows grouped G1→G5. Columns: #, Group, Document Name, Standard, Requirement, Priority, **Status** (auto/override badge), links to detail sheet, Remark. Detail-sheet rows show checks req/done/%. |
| `/projects/:projectId/priority/a` | **Priority A** | Read-only filtered mirror of Tracker where priority = A (11 rows) |
| `/projects/:projectId/priority/b` | **Priority B** | …priority = B (14 rows) |
| `/projects/:projectId/priority/c` | **Priority C** | …priority = C (3 rows) |
| `/projects/:projectId/items` | **Item Details** | §8 — the focus of this brief |
| `/projects/:projectId/phase` | **Phase Progress** | Added 2026-07-26, inspired by a reference tracker ("RSMS", a different airport/bid). Critical-cutoff banner; an "Unassigned" card plus one progress card per real lifecycle Phase (`LIFECYCLE_PHASE_DEFS` — see note below); an editable table of Phase + Workflow Status (manual 5-state pipeline: Pending→Preparing→AwaitingApproval→Ready→Submitted) + Document Date/Expiry Date/Responsible Person/Document Link per item; and a "View History" dialog (searchable audit log of every edit, values rendered as human labels). Fully additive — independent of the checkbox-derived Status/Dashboard/Tracker above (§6 untouched). |
| `/projects/:projectId/schedule` | **Project Management** | Added 2026-08-29, modeled on a reference Gantt tracker. A left panel of named delivery phases (duration + % complete) and a right timeline panel (month-label header, one positioned/filled bar per phase, milestone markers with hover tooltips) plus a milestone list with edit/delete controls; an optional contract-start-date dashed reference line. Shown for **every** `templateKind`, unlike the MAR-only tabs above — see §5.3c. Add/Edit/Delete gated to Admin/Project Manager. Each phase also carries a `weightPercent` (added 2026-08-30, modeled on `project-joy-gantt.lovable.app/apron`'s งวดงาน installment percentages) — its share of the total project, shown next to duration in the phase list, with a banner above the chart tracking the running total against 100%. Each phase can also carry a work-breakdown list of activities (added 2026-09-02), rendered as indented sub-rows under their phase (no expand/collapse) with their own dates/%complete/weight scoped to that phase — see §5.3c. |
| `/projects/:projectId/boq` | **BOQ Estimate** | Added 2026-09-05, modeled on a reference Bill-of-Quantities cost-estimate form styled after the real ปร.4/ปร.5 Thai government forms. Line items split into user-named category tabs; each line has a quantity/unit/material-unit-cost/labor-unit-cost with a derived row total, an "Add Item" button, and a delete-row icon; each category shows a running subtotal. A summary card shows subtotal / VAT % (editable) / net total plus a per-category %-share breakdown with colored mini progress bars. Shown for **every** `templateKind`, unlike the MAR-only tabs above — see §5.3d. Add/Edit/Delete gated to Admin/Project Manager; the whole tab is read-only for other roles. |
| `/projects/:projectId/guidelines` | **Guidelines** | Priority definitions, critical sequence, document-quality rules, colour legend, disclaimer (rules.ts) |

Priority tabs are **derived mirrors** — no independent editing. An unknown `:projectId` renders a "Project not found" panel instead of the tab set (`ProjectShell.tsx`), so no child page needs its own defensive check.

> **Lifecycle Phase (Phase Progress tab):** `item.phase` is a real, independent, reviewer-assigned classification (`LifecyclePhase`/`LIFECYCLE_PHASE_DEFS` in `rules.ts`) — 7 named phases (Pre-Bidding, Bidding, After Contract, Installation & Commissioning, Warranty, Operation & Maintenance, Others) plus an explicit "Unassigned" bucket for items with no phase set. It has **no relationship** to `GroupId`/`GROUP_DEFS` (technical document categories, §2.1's Group 1–5, untouched — an earlier version of this tab relabeled Groups as a placeholder; that has been fully replaced). **Confirmed 2026-07-26: every MAR item defaults to `'AfterContract'`** (§5.4) — real data, not a per-vendor guess, since the MAR checklist structure only ever represents post-contract-award submittals. New MAR projects can override this default at creation time via "Add Project"'s **Default phase** picker (§5.4), which bulk-sets every one of the new project's items to the chosen phase instead of `'AfterContract'`. "Unassigned" is reserved for the rare case a reviewer explicitly clears an item's phase; "Others" remains a real, distinct category for genuinely miscellaneous documents, never a default.

> **AOT/DOA-shaped projects (AOT added 2026-07-27, DOA added same day):** a project with `meta.templateKind === 'aot'` or `'doa'` has no Group/Priority/checkbox detail sheets at all (§5.2) — its `phase` comes pre-assigned per item from the real template (§5.4a/§5.4b), not from a bulk Default-phase pick. `ProjectShell.tsx` renders "Dashboard" plus **Project Management** (§5.3c) and **BOQ Estimate** (§5.3d) — both generic project-level data, unaffected by templateKind — for either — Tracker/Priority/Item Details/Guidelines/Phase Progress aren't linked since Group/Priority/detail sheets don't apply, though their routes still exist and degrade gracefully if hit directly (empty table / "no detail sheet" fallback, never a crash). The critical-cutoff banner uses `AOT_CRITICAL_NOTICE` for AOT, `CRITICAL_SEQUENCE` for MAR, and is **omitted entirely** for DOA (no equivalent real notice exists to show — see §5.4b). `selectAllProjectsSummary` (`selectors.ts`) branches per `templateKind` so the Projects Summary card never calls the Priority-indexing `rollup()` on an AOT or DOA project.

---

## 8. Item Details tab — detailed spec (ref: check-chime-charm prototype)

Two-pane layout.

### 8.1 Left sidebar — "Item Detail Sheets"
- Scrollable list of the **14 items that have a detail sheet**, in order: 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 25, 26, 27.
- Each entry: item number (badge) + short title. Selected entry highlighted.
- Selecting an entry sets the active sheet (URL param, e.g. `/items?item=1`, so it is linkable/refresh-safe).
- Default selection: item 1.

### 8.2 Detail panel header
- **Priority badge** (A / B / C, colour-coded per §9) + subtitle `Item {no} · {group}` (e.g. "Item 1 · G1").
- Title as `<h2>` (e.g. "Technical Datasheet / Product Catalogs").
- Applicable standard line (small, muted).
- **Status badge** — the live `autoStatus` (or override).
- Progress readout: `{done} of {required} checks ticked` + a percentage and a `Progress` bar (e.g. "76 of 95 checks ticked · 80%").

### 8.3 Bulk actions row
- **Select all rows** (row-selection checkbox in the header) + "{n} selected" counter.
- **Check all cells** — set every cell in the sheet true.
- **Uncheck all cells** — set every cell false.
- **Toggle cells** — invert every cell.
- When rows are selected, the check/uncheck/toggle actions apply to **selected rows only**; with no selection they apply to the whole sheet. Debounce persistence on bulk ops (one write, not per cell).

### 8.4 The checkbox table
- Leftmost column: per-row selection checkbox.
- Then `ARTICLE (TOR)`, `DESCRIPTION`, then **one column per `CheckColumn`** of that sheet, then `REMARK`.
  - Item 1 columns → `DATASHEET / PRODUCT CATALOGUE · MODEL NO. / ORDERING REF.`, `RATING`, `DIMENSION`, `MATERIAL`, `PHOTOMETRIC DATA`.
  - Other sheets render their own columns from §5.4 — **build the table generically from `sheet.columns`; never hard-code Item 1's columns.**
- A checkable cell renders an interactive checkbox; ticked = ✓, unticked = a muted dot `·`. Clicking toggles that one cell and updates every derived view.
- Optional sub-heading rows (`section`, e.g. "Missing Item in TOR but stated in DWG") render as a spanning divider row.
- Sticky header row; the table scrolls within the panel.

### 8.5 Accessibility & feel
- Every checkbox is keyboard-reachable with a real `<label>` / `aria-label` (`"{item title} — {description} — {column label}"`).
- Optimistic UI: toggle updates state first, persists after.
- Match the prototype's calm, dense, engineering-register aesthetic — no animation flourishes.

---

## 9. Design tokens

> **Revised 2026-07-25:** the hex values originally specified below were this brief's best guess before the two Lovable prototypes were inspected directly. Pulling the prototypes' actual compiled CSS (`reference/lovable-dashboard-styles.css`, `reference/lovable-item-details-styles.css`) showed they use Tailwind's stock palette, not custom hex — the app now matches the prototypes exactly rather than the hex values below. Kept here for history; **`src/components/shared/statusStyles.ts` is the source of truth going forward.**

- **Font:** system-ui stack (the prototypes load no webfont — Inter is not actually used). Dense tables, 13–14px body.
- **Status colours (as actually implemented):** Submitted `emerald-50/700` · In Progress `amber-50/700` · Pending `slate-100/600` · Needs Revision `rose-50/700` · Not Available `slate-200/700`. Only In Progress and Pending are ever populated in the prototypes' seed data — Submitted/Needs Revision/Not Available are inferred from the same rose/amber/emerald/slate system.
- **Priority badges (as actually implemented):** A `rose-100/800`, B `amber-100/800`, C `emerald-100/800` — confirmed from the live Dashboard's by-priority badges.
- **Checked cells** in the Item Details checkbox table render `emerald-100/700` (confirmed from check-chime-charm.lovable.app); unchecked cells show a muted `·`.
- **Derived/linked cells** (Tracker status pulled from a sheet): subtle grey fill + emerald text, to echo the spreadsheet's "don't type here" convention.
- **Header band:** light bluegreen (teal) `#0F766E`, white text — changed 2026-09-05 from the original dark slate `#34495E` per explicit request; the Project Management/BOQ Estimate Excel exports' header-row fill (`SCHEDULE_COLORS.headerBg` in `scheduleExcelFormat.ts`) was updated to the same `#0F766E` so the exported files match the app's on-screen theme. The ADS-B Excel/Word exports' navy header (`ADSB_COLORS` in `adsbFormat.ts`) was deliberately left untouched — it matches a real external reference template family, not this app's own branding. ⚠️ **still not reconciled with the prototype**, which renders a plain white header with no colour band at all — flagged as an open question, not yet resolved.
- **Workflow-status badges (Phase Progress tab, added 2026-07-26):** Pending `slate-100/600` · Preparing `sky-50/700` · Awaiting Approval `amber-50/700` · Ready `violet-50/700` · Submitted `emerald-50/700` (`WORKFLOW_STATUS_BADGE_CLASS` in `statusStyles.ts`). Deliberately introduces `sky`/`violet` — two hues not used by the checkbox-derived `STATUS_BADGE_CLASS` — so the two independent status systems stay visually distinguishable when shown together.
- **Importance badges (AOT items only, added 2026-07-27):** Critical `rose-100/800` · Normal `slate-100/600` · Supporting `sky-50/700` · Critical-checkpoint `violet-100/800` (`IMPORTANCE_BADGE_CLASS` in `statusStyles.ts`). Only rendered in `PhaseItemsTable.tsx` when `item.code` is present — invisible for MAR items.
- **DocType badges (DOA items only, added 2026-07-27):** Shared `emerald-100/800` · Mandatory `rose-100/800` · Site-specific `sky-50/700` (`DOC_TYPE_BADGE_CLASS` in `statusStyles.ts`). Rendered alongside a plain-text site label (`DOA_SITE_LABEL`) in `PhaseItemsTable.tsx` only when `item.docType`/`item.site` are present — invisible for MAR/AOT items.
- Keep it flat and legible; this is an audit tool, not a marketing page.

~~Original hex-based spec (superseded above):~~
- ~~Status colours: Submitted `#1E8449` (green) · In Progress `#2471A3` (blue) · Pending neutral grey · Needs Revision `#922B21` (red) · Not Available `#717D7E` (slate).~~
- ~~Priority badges: A red `#C0392B`, B amber `#B9770E`, C green `#1E8449`.~~

---

## 10. Persistence

**Project/tracker data (`projects`, `items`, `sheets`, `history`) moved from per-browser `localStorage` to shared Postgres on 2026-08-04**, so that create/edit/delete are visible to every signed-in user, not just the browser that made the change (the change was prompted by an admin's project delete not being visible to other users — the underlying gap was that *no* project data was ever shared, not just deletes).

```ts
interface ChecklistState {
  projects: ProjectRecord[];
  projectOrder: string[];
}
interface PersistencePort {
  load(): Promise<ChecklistState | null>;
  saveProject(record: ProjectRecord): void;                       // fire-and-forget, debounced per project id
  deleteProject(projectId: string): Promise<{ error?: string }>;  // awaited, so a rejection can roll back
}
```
- **Schema:** one row per project in `project_records` (`api/_lib/db.ts`) — `id, meta, items, sheets, history` as JSONB, plus `updated_by`/`updated_at`. Project existence = row existence; display order = `ORDER BY seq ASC` (an auto-increment tie-breaker column) — there is no separate `projectOrder` table. `schedule` (§5.3c) and `boq` (§5.3d, BOQ Estimate tab) were both added later as their own JSONB columns via a self-migrating `ALTER TABLE project_records ADD COLUMN IF NOT EXISTS ... DEFAULT '...'::jsonb` in `ensureSchema()` — no manual migration step, same pattern for both.
- **Routes — one file, `api/projects/index.ts`, method + `?id=` query param dispatch (not a path segment — see the Vercel function-count note below):** `GET /api/projects` lists everything (any signed-in user). `PUT /api/projects?id=X` upserts one full record — the same code path serves initial create, every debounced edit-sync, "Reset to seed", **and** first-time bootstrap seeding (the client just PUTs each of its baked-in `INITIAL_PROJECTS` once when the list comes back empty; `ON CONFLICT (id) DO UPDATE` makes two browsers racing to seed harmless, since both are upserting identical source data — see `seedFromDefaults()` in `persistence.ts`). `DELETE /api/projects?id=X` is **`requireAdmin`-gated server-side** — this closes a real gap that existed before the migration, where the Delete button was only hidden client-side for non-admins with nothing stopping a devtools call from deleting anyway.
- **Why the server can't build seed data itself:** `tsconfig.api.json` only includes `api/**` — API routes cannot import anything from `src/**`, so `api/_lib/validateProjectRecord.ts` is a deliberately shallow, hand-duplicated shape check (envelope only, not a full `types.ts` mirror), and seeding must be client-initiated.
- **Write path stays optimistic-local-first**, same snappy tick-a-checkbox UX as before: every store action updates Zustand state immediately, then fires a debounced (~600 ms per project id) background `PUT` via `createApiPersistence` (`src/store/persistence.ts`). `deleteProject` is the one deliberate exception — it's awaited, and rolls the optimistic removal back if the server rejects it (wrong role, network failure), since delete is rare/destructive and now has a real rejection path worth surfacing.
- **Read path is fetch-on-mount only, no polling/websockets** — `useTrackerStore.hydrate()` (called once from `AppShell`, guarded by `hydrated`/`hydrating` so React's dev-mode double-effect doesn't double-fetch) replaces local state from `GET /api/projects` on page load. An already-open idle tab will **not** see another user's edits until it reloads or navigates — a deliberate scope decision, matching the same pattern already used by auth/procurement-leads elsewhere in this app.
- **Known accepted risks of this design** (small internal-reviewer tool, same risk tolerance as the rest of §10): (1) whole-record, last-write-wins overwrites — two users editing the *same* project inside the same debounce window will have the later write clobber the earlier one, no field-level merge; (2) if a brand-new project's very first background `PUT` silently fails and nobody edits it again, it will quietly disappear from its creator's own next reload (since `hydrate()` fully replaces local state from the server); (3) only shallow server-side validation, per the cross-import constraint above. None of these are fixed yet — revisit if they're observed in practice.
- **Projects Summary page permissions (added 2026-08-04):** Add Project and Edit Project (title/vendor/scope/projectType/preparedDate, via `EditProjectDialog.tsx`) are visible to `admin` and `ProjectManager` roles only; Delete stays `admin`-only. **Add/Edit are client-side-gated only, same accepted-risk posture as the existing "admin-only static/definitional field editing" feature** (`ItemMetaPatch`'s admin-only fields in `useTrackerStore.ts`) — `PUT /api/projects?id=X` still accepts any signed-in user server-side, so a non-admin/PM could in principle call it via devtools to create or retitle a project. Unlike Delete (a destructive, hard-to-reverse action that got full `requireAdmin` server enforcement), create/edit are reversible and low-stakes for this small internal tool, so the extra server-side role check was deliberately skipped to avoid complicating the shared upsert endpoint (which also serves ordinary item-edit syncing for every role) — revisit if this needs tightening later.
- **"Reset to seed"** now resets the *shared* row — resetting a project wipes every user's edits to it, not just the resetting browser's own view (the confirm dialog copy says this explicitly). Still resets to the project's recorded initial state (the real seed for U-Tapao/Airsafe; the blank template for its own `templateKind` for the demo project and any project created via "Add Project").
- `createLocalStoragePersistence`/`STORAGE_KEY` (the old `airsafe-mar-tracker/v2` localStorage adapter) were deleted outright as part of this migration — no data needed preserving, since the seed data in code was already authoritative for every prior deployment.
- **Vercel Hobby plan caps a deployment at 12 serverless functions** (one per `api/**/*.ts` route file, excluding `_lib/`) — discovered when adding 3 new project routes pushed the count to 15 and deployment failed outright.
  - **First attempt (wrong): optional catch-all files (`[[...path]].ts`) don't actually work on plain (non-Next.js) Vercel Functions.** They deployed and matched requests under the path, but `req.query.<name>` came back empty for every request regardless of how many URL segments were actually present, and the bare zero-segment URL (`/api/projects`) 404'd at the platform level instead of matching at all. This silently broke admin project-delete in production (confirmed via curl: `DELETE /api/projects/demo-placeholder` reached the function but always fell into the "zero segments" branch). **Do not use `[...x].ts` or `[[...x]].ts` catch-all files for API routing in this repo.**
  - **What actually works, and what's live:** single dynamic-segment files (`[id].ts`, exactly one path segment) are proven and used throughout (`procurement/documents/[id].ts`) — keep using those freely. To consolidate two routes into one file without a path segment at all, dispatch by HTTP method plus an ordinary `?id=` query string param instead (see `api/projects/index.ts`, `api/auth/users.ts`, and `api/tasks/index.ts` — the last merged from a separate `tasks/[id].ts` on 2026-08-29 specifically to free a slot for `api/cron/daily-digest.ts` without breaking this cap) — query params are parsed reliably, unlike catch-all segments.
  - **Before adding any new `api/**` route file, count existing ones first** (`find api -name "*.ts" -not -path "*/_lib/*" | wc -l`, must stay ≤ 12) — either fold the new route into an existing file via method/`?id=` dispatch, or consolidate an existing pair the same way to make room.
- **Daily digest cron (added 2026-08-29).** `vercel.json`'s `crons` array schedules a daily `GET /api/cron/daily-digest` (`0 1 * * *`, once/day — the max frequency the Hobby plan allows). The route is a Slack digest of what changed across all projects since its last successful run, not user-facing:
  - **Auth:** Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when a `CRON_SECRET` env var is configured on the project; the route 401s any request without a matching header, so it can't be triggered by hitting the URL directly. `CRON_SECRET` must be added to the Vercel project's env vars (any environment the cron runs in) — there's no default.
  - **What it detects, and how:** (1) *new projects* — a `project_records.id` with no prior row in `project_digest_snapshots`, whose `created_at` falls within the window; (2) *any project touched* — `updated_at` within the window; (3) *checkbox/status changes* — diffs each item's `effectiveStatus` (re-derived server-side, see below) against the **previous run's** per-item snapshot, so it reports exactly which items flipped status (e.g. into `Submitted`), not just an aggregate count; (4) *Phase Progress field changes* — `history` entries (§5.3b) with `timestamp` inside the window. The window is "since the last successful run," tracked in a one-row-per-key `cron_state` table (`key='daily_digest'`), not a hardcoded 24h guess.
  - **Why a snapshot table is needed at all:** checkbox ticks and `manualStatus` overrides carry **no timestamp anywhere in the schema** — only Phase Progress's `history` log is timestamped (§5.3b). Without storing yesterday's per-item status (`project_digest_snapshots`, one row per project, overwritten every run) there would be no way to know a checkbox-derived status changed, let alone which item.
  - **`api/_lib/rollup.ts`** is a small, deliberately-shallow re-implementation of `domain/derive.ts`'s `checksRequired`/`checksDone`/`effectiveStatus` — same cross-import constraint as `validateProjectRecord.ts` (api/ can't import src/**). If §6's derived-status algorithm changes, update both.
  - **Delivery:** POSTs `{ text }` to a Slack Incoming Webhook URL in the `SLACK_WEBHOOK_URL` env var. If unset, or the POST fails, the route still computes and persists the snapshot/last-run state (so a broken webhook doesn't cause diffs to pile up or replay) and returns `502` with the computed digest text in the body, so failures are visible in the Vercel Cron invocation log even though nothing reached Slack.
  - **Known gap:** `sheets`/`items` are fetched and re-diffed for every project on every run (no incremental query) — fine at this app's scale (a handful of projects), revisit if that changes.
  - **Local testing caveat:** `vercel dev` only injects env vars already registered on the *linked* Vercel project (via `vercel env pull`/dashboard) into the function runtime — a brand-new key just appended to `.env.local` is **not** picked up, even after a full process restart, until it's also added with `vercel env add <NAME> <environment>` (or via the dashboard) and re-pulled. Confirmed empirically 2026-08-29: `AUTH_SECRET`/`SIGNUP_INVITE_CODE` (already-registered vars) loaded fine while a locally-appended `CRON_SECRET` never appeared in `process.env` until registered remotely.
- **Auth (custom, added 2026-07-31 — third iteration this session, after Clerk then Supabase were both ruled out).** Clerk's production instance requires a domain the deployer controls DNS for, which blocked deploying to a plain `*.vercel.app` URL; Supabase was then explicitly ruled out too (no third-party auth vendor). What's live now is hand-rolled: `api/auth/{signup,login,logout,session}.ts` are Vercel Serverless Functions (Node runtime, deployed alongside the static Vite build — no framework change needed) backed by Vercel Postgres (Neon). `api/_lib/auth.ts` hashes passwords with `bcryptjs` (cost 10), signs a JWT session (`{sub, email}`, 7-day expiry, HS256) with `jose` using the server-only `AUTH_SECRET` env var, and sets/reads it as an httpOnly, `SameSite=Lax`, `Secure`-in-production cookie via the `cookie` package. `api/_lib/db.ts`'s `ensureSchema()` runs `CREATE TABLE IF NOT EXISTS users (...)` idempotently on cold start — no manual migration step. `POSTGRES_URL` etc. are auto-injected once a Postgres/Neon store is linked to the Vercel project (Storage tab); nothing to configure by hand beyond that link.
- **Signup is gated by a shared invite code** (`SIGNUP_INVITE_CODE` env var, checked in `api/auth/signup.ts`) — since there's no vendor-provided invite/allowlist system anymore, this is the only thing stopping anyone who reaches `/auth` from creating an account with full read/write access to every project.
- `useAuthStore` (`store/useAuthStore.ts`) wraps plain `fetch` calls to `api/auth/*` (no client SDK) — `init()` hits `GET /api/auth/session` on mount; `AppShell` redirects to `/auth` (outside the gated route tree) when there's no user. Sign-out lives in `components/auth/UserMenu.tsx`, rendered in both `ProjectShell`'s dark header (`dark` prop) and `ProjectsSummaryPage`'s light header.
- **No Google/OAuth sign-in** — deliberately dropped for this pass (implementing an OAuth flow ourselves, verifying provider ID tokens server-side, is real additional security-sensitive work); email+password only. Can be added later.
- **Known gaps, accepted for now given this is a small internal-reviewer tool:** no password-reset flow (no email-sending infra), no brute-force/rate-limiting on login attempts, sessions have a single fixed 7-day expiry with no refresh/rotation. Revisit before this handles anything more sensitive.
- **Local dev:** plain `npm run dev` (Vite only) does **not** serve `/api/*` — auth calls will fail gracefully (redirects to `/auth`, shows a generic error on submit) but won't work. Use `npm run dev:full` (`vercel dev`) to exercise the full stack locally, after `vercel env pull .env.local` once a Postgres store is linked.

---

## 11. Coding conventions

- TypeScript strict; no `any`; model unions exhaustively (`switch` with `never` default on `Status`).
- Derived logic lives **only** in `domain/derive.ts`. If a component computes a total inline, that's a bug.
- Store holds raw state (items, sheets, overrides, selection); everything else is a selector.
- One component per file; colocate a `.test.tsx` for anything with logic.
- Conventional Commits. Small PRs. Update this file when a decision changes.
- No spreadsheet/PII data committed beyond the checklist itself. This app is not a system of record for contracts.

---

## 12. Build phases

1. **Foundation** — Vite + TS + Tailwind + shadcn scaffold; `types.ts`; `checklist.seed.ts`; `derive.ts` + passing tests locking §6.4 numbers.
2. **Store & persistence** — Zustand store, selectors, `PersistencePort` + localStorage adapter, reset.
3. **Item Details tab (§8)** — build this first after the store; it is where ticks originate and it exercises every derived value.
4. **Tracker** — master register grouped G1→G5 with live status + links into Item Details.
5. **Dashboard** — cards, roll-ups, by-priority table, critical sequence, integrity line.
6. **Priority A/B/C + Guidelines** — derived mirrors + static rules content.
7. **Polish** — a11y pass, keyboard nav, print/landscape styles for Tracker & Priority, empty/reset states.

Definition of done for each phase: types check, tests green, no derived value computed outside `derive.ts`, and the tab matches its prototype.

---

## 13. Agent working protocol

- **Start every session by reading this file**, then run the test suite to confirm the §6.4 invariants still hold before changing anything.
- Prefer editing existing modules over adding parallel ones. Keep `derive.ts` and `types.ts` framework-free.
- When you change the data model or a derived rule, update §5/§6 **and** the tests in the same change.
- If a requirement here conflicts with a prototype, the **domain rules (§2) and derived logic (§6) win**; flag the conflict in the PR description rather than silently diverging.
- Never fabricate standards, article numbers, or tick states. The app records reviewer input; it does not infer engineering facts.
- Ask before introducing a backend, auth, or any dependency not listed in §3.

---

## 14. Guidelines tab content (verbatim rules to render)

**Priority definitions**
- **A — Essential:** required *before* any approval review commences.
- **B — Mandatory:** required by Clause 1.4 — complete upon MAR submission.
- **C — Supporting:** submitted with the MAR or as specified in the Contract.

**Critical sequence** — as §2.2.

**Document quality**
- All documents in English (or with a complete English translation).
- Certificates must state: certificate number, issue date, expiry date, issuing organisation.
- Test reports must identify: testing laboratory, report number, tested product model (matching the model proposed).
- Manufacturer declarations / brochure statements are **not** acceptable substitutes for test reports.
- Certificates must reference the **latest applicable edition** of the relevant standard; where a standard has been superseded, certification to an earlier edition is acceptable only with a documented gap analysis to the current edition.

**Colour legend** — grey/green = derived (do not edit); white = manual entry; blue underline = navigation link.

**Disclaimer** — This register is prepared per Section 28 01 00 and lessons from the OCEM review (MAR-AFL-0001-R1). It is an internal reference and communication tool, **not a contractual document**. Contractual matters are reviewed and verified by the legal department.
