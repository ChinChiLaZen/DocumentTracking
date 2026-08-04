import type { ProjectMeta } from '../../data/types'

/** e.g. "Civil Works — Second Runway..." -> "Civil-Works-Second-Runway" for use in a download filename. */
export function projectFileSlug(meta: ProjectMeta): string {
  return (
    meta.title
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || meta.id
  )
}
