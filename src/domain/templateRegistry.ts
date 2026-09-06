import type { TemplateDefinition, TemplateKind } from '../data/types'
import { TEMPLATE_ITEMS, TEMPLATE_SHEETS } from '../data/checklistTemplate'
import { AOT_TEMPLATE_ITEMS, AOT_CRITICAL_NOTICE } from '../data/aotTemplate'
import { DOA_TEMPLATE_ITEMS } from '../data/doaTemplate'
import { ADSB_TEMPLATE_ITEMS } from '../data/adsbTemplate'
import { CRITICAL_SEQUENCE, GROUP_DEFS, PRIORITY_DEFS } from './rules'

/**
 * The 4 templates this app ships with, translated from their existing static
 * data files (checklistTemplate.ts/aotTemplate.ts/doaTemplate.ts/
 * adsbTemplate.ts) and rules.ts constants into the generic TemplateDefinition
 * shape (data/types.ts). These stay the fallback/default source of truth —
 * an admin's edit never mutates these arrays, only overlays a DB row on top
 * (see mergeTemplates) — which is what keeps aotTemplate.test.ts/
 * doaTemplate.test.ts/adsbTemplate.test.ts green untouched no matter what an
 * admin does in /templates.
 */
export const BUILTIN_TEMPLATE_DEFS: TemplateDefinition[] = [
  {
    id: 'mar',
    isBuiltin: true,
    label: 'MAR — Vendor Approval Checklist',
    description: 'Starts from the same 28-item MAR checklist structure used by every MAR project, fully unticked.',
    tabSet: 'full',
    hasDetailSheets: true,
    hasGroups: true,
    hasPriority: true,
    supportsDefaultPhase: true,
    groups: GROUP_DEFS,
    priorities: PRIORITY_DEFS,
    criticalNotice: {
      heading: 'Critical cutoff — review sequence must not be skipped',
      lines: CRITICAL_SEQUENCE,
    },
    items: TEMPLATE_ITEMS,
    sheets: TEMPLATE_SHEETS,
  },
  {
    id: 'aot',
    isBuiltin: true,
    label: 'AOT — Bid Submission Checklist',
    description:
      "Clones the 94-item AOT (Airports of Thailand) bid-submission checklist across Phases 0-3 — Suvarnabhumi/AOT format. Each item keeps its own real phase and importance; there's no checkbox detail-sheet or Group/Priority for this template.",
    tabSet: 'single',
    hasDetailSheets: false,
    hasGroups: false,
    hasPriority: false,
    supportsDefaultPhase: false,
    groups: [],
    priorities: [],
    criticalNotice: {
      heading: 'จุดตัดสิทธิ์สำคัญ — Critical eligibility cutoff',
      lines: AOT_CRITICAL_NOTICE,
    },
    items: AOT_TEMPLATE_ITEMS,
    sheets: [],
  },
  {
    id: 'doa',
    isBuiltin: true,
    label: 'DOA — 3-Airport Document Tracker',
    description:
      "Clones the 64-item DOA (Department of Airports) document tracker spanning Khon Kaen, Udon Thani and Surat Thani airports. Each item keeps its own real phase, document-type badge (Shared/Mandatory/Site-specific) and airport assignment; there's no checkbox detail-sheet or Group/Priority for this template.",
    tabSet: 'single',
    hasDetailSheets: false,
    hasGroups: false,
    hasPriority: false,
    supportsDefaultPhase: false,
    groups: [],
    priorities: [],
    // No equivalent real notice exists to transcribe for DOA — omitted rather
    // than fabricated (CLAUDE.md's "never fabricate standards" rule).
    items: DOA_TEMPLATE_ITEMS,
    sheets: [],
  },
  {
    id: 'adsb',
    isBuiltin: true,
    label: 'ADS-B Installation Checklist — CATM Ground Station & Vehicle Terminal',
    description:
      "Clones the 96-item ADS-B ground-station/vehicle-terminal (CATM) installation checklist across 5 real phases (Design & Approval, Site Readiness, Installation, Testing & Commissioning, As-built & Handover). Each item carries bilingual (Thai/English) text plus its own real installation phase; 80 of the 96 also carry the Employer ITP's Required-evidence and Hold/Witness-point fields. No checkbox detail-sheet or Group/Priority for this template.",
    tabSet: 'single',
    hasDetailSheets: false,
    hasGroups: false,
    hasPriority: false,
    supportsDefaultPhase: false,
    groups: [],
    priorities: [],
    // No equivalent real notice exists to transcribe for ADS-B either.
    items: ADSB_TEMPLATE_ITEMS,
    sheets: [],
  },
]

/**
 * The effective registry: built-ins with any same-id admin override replacing
 * them, plus any additional custom templates appended. `overrides` comes from
 * GET /api/templates (only override/custom rows ever round-trip through the
 * DB — see useTemplateStore.ts).
 */
export function mergeTemplates(overrides: TemplateDefinition[]): TemplateDefinition[] {
  // Built-ins first, in their original order (same-id override replacing the
  // shipped default), then any custom (non-built-in-id) templates appended
  // in the order the server returned them.
  return [
    ...BUILTIN_TEMPLATE_DEFS.map((b) => overrides.find((o) => o.id === b.id) ?? b),
    ...overrides.filter((o) => !BUILTIN_TEMPLATE_DEFS.some((b) => b.id === o.id)),
  ]
}

/** Looks up a template by id, falling back to the built-in 'mar' definition
 *  if the id is unknown/undefined (mirrors the old "absent templateKind means
 *  mar" backward-compat posture from ProjectMeta.templateKind). */
export function resolveTemplate(
  templates: TemplateDefinition[],
  id: TemplateKind | undefined,
): TemplateDefinition {
  const found = templates.find((t) => t.id === id)
  if (found) return found
  return templates.find((t) => t.id === 'mar') ?? BUILTIN_TEMPLATE_DEFS[0]
}
