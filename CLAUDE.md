# CLAUDE.md — Document Tracking (MAR) Web App

> Persistent project brief and source of truth for Claude Code.
> Read this file at the start of every session before touching code.
> When a decision here proves wrong, update **this file** in the same PR — never let the code and this brief drift apart.

---

## 1. What we are building

A single-purpose internal web app that replaces the Airsafe MAR tracking spreadsheet with a live, linked, click-to-tick interface.

It tracks the documents a manufacturer must submit for **Vendor Approval / Material Approval Request (MAR)** on:

- **Project:** Civil Works — Second Runway & Taxiway, U-Tapao International Airport
- **Scope:** Airfield Lighting, Section 28 01 00
- **Current vendor:** Airsafe Airport Equipment Co., Ltd.

The app must reproduce the behaviour of the spreadsheet it comes from: the **checkboxes on each Item detail sheet are the single source of truth**, and every roll-up, status, priority count and dashboard figure is *derived* from them — never entered twice.

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
| Components | **shadcn/ui** (Radix under the hood) | Table, Checkbox, Badge, Tabs, Progress, Card, ScrollArea, Dialog, Tooltip |
| Icons | **lucide-react** | |
| State | **Zustand** | one store; all derived values are selectors, never stored |
| Routing | **react-router-dom** | one route per tab (§7) |
| Persistence | **localStorage** adapter behind a `PersistencePort` interface (§10) | swappable for a real API later — do not hard-code `localStorage` calls in components |
| Tests | **Vitest** + **@testing-library/react** | derived-value logic in §6 must be unit-tested |
| Lint/format | ESLint + Prettier | |

> If this app is later folded into the WorkOS Next.js codebase, only the routing, persistence and build layers change — §5 (data model) and §6 (derived logic) are portable as-is. Keep them framework-free (plain TS modules).

---

## 4. Repository structure

```
src/
  data/
    checklist.seed.ts        # the 28 items + 14 detail sheets, typed (§5.4)
    types.ts                 # domain types (§5.1–5.3)
  domain/
    derive.ts                # ALL derived-value logic (§6) — pure, framework-free
    derive.test.ts           # unit tests locking the numbers in §6.4
    rules.ts                 # priority defs, group defs, status enum, guideline text
  store/
    useTrackerStore.ts       # Zustand store + selectors
    persistence.ts           # PersistencePort + localStorage adapter (§10)
  components/
    layout/AppShell.tsx      # header + tab nav (§7)
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
```

### 5.2 Item (the 28 register rows)

```ts
interface Item {
  no: number;                     // 1..28
  group: GroupId;
  name: string;                   // "Technical Datasheet / Product Catalogs — All Fixture Types"
  standard: string;               // "Clause 1.4.O / ICAO Annex 14 / IEC TS 61827 / FAA AC 150/5345-46E"
  requirement: string;            // acceptance criteria (long text)
  priority: Priority;
  detailSheetId?: string;         // present only for the 14 items that have a detail sheet
  manualStatus?: Status;          // set ONLY when the reviewer overrides (§6.3); items w/o a detail sheet use this
  remark?: string;                // free text OR a derived template (Item 3, §6.5)
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

### 5.4 Seed data (`checklist.seed.ts`)

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

Seed the actual tick state from the spreadsheet (initial: **120 of 282 ticked ≈ 43%**). Row descriptions and article numbers per detail sheet are carried verbatim from the workbook — see `checklist.seed.ts`. Every row's `remark` seeds to `"Rev.0 - 20260725"`.

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

Header shows project title + preparation date `7 July 2026`, then a tab bar. Routes:

| Route | Tab | Content |
|---|---|---|
| `/` | **Dashboard** | Overview cards (Total 28, Submitted, In Progress, Pending, Needs Revision, Not Available), Overall Submission %, Checkbox Roll-up %, By-Priority table, Critical Sequence list, Quick Navigation, integrity line |
| `/tracker` | **Tracker** | Master register: all 28 rows grouped G1→G5. Columns: #, Group, Document Name, Standard, Requirement, Priority, **Status** (auto/override badge), links to detail sheet, Remark. Detail-sheet rows show checks req/done/%. |
| `/priority/a` | **Priority A** | Read-only filtered mirror of Tracker where priority = A (11 rows) |
| `/priority/b` | **Priority B** | …priority = B (14 rows) |
| `/priority/c` | **Priority C** | …priority = C (3 rows) |
| `/items` | **Item Details** | §8 — the focus of this brief |
| `/guidelines` | **Guidelines** | Priority definitions, critical sequence, document-quality rules, colour legend, disclaimer (rules.ts) |

Priority tabs are **derived mirrors** — no independent editing.

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
- **Header band:** dark slate `#34495E`, white text — ⚠️ **not yet reconciled with the prototype**, which renders a plain white header with no colour band. Flagged as an open question, not yet changed.
- Keep it flat and legible; this is an audit tool, not a marketing page.

~~Original hex-based spec (superseded above):~~
- ~~Status colours: Submitted `#1E8449` (green) · In Progress `#2471A3` (blue) · Pending neutral grey · Needs Revision `#922B21` (red) · Not Available `#717D7E` (slate).~~
- ~~Priority badges: A red `#C0392B`, B amber `#B9770E`, C green `#1E8449`.~~

---

## 10. Persistence

```ts
interface PersistencePort {
  load(): ChecklistState | null;
  save(state: ChecklistState): void;
}
```
- Default adapter: `localStorage` (key `airsafe-mar-tracker/v1`), debounced ~300 ms.
- Components and the store depend on `PersistencePort`, **never** on `localStorage` directly, so a REST/tRPC adapter can drop in later without touching UI.
- Provide a "Reset to seed" action (guarded by a confirm dialog).
- No secrets, no network calls in v1.

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
