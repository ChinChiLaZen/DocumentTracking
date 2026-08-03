import { useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { EditableField } from '../shared/EditableField'
import {
  EMPLOYER_RESULT_BADGE_CLASS,
  HW_POINT_BADGE_CLASS,
  RESULT_BADGE_CLASS,
} from '../shared/statusStyles'
import { ADSB_INSTALL_PHASE_DEFS } from '../../domain/rules'
import type { AdsbEmployerResult, AdsbHwPoint, AdsbInstallPhase, AdsbResult, Item } from '../../data/types'
import type { ItemMetaPatch } from '../../store/useTrackerStore'

interface AdsbItemCardProps {
  item: Item
  role: 'contractor' | 'employer'
  editable?: boolean
  onCommit(itemNo: number, patch: ItemMetaPatch): void
}

const CONTRACTOR_RESULTS: { value: AdsbResult; label: string }[] = [
  { value: 'Pass', label: 'ผ่าน / Pass' },
  { value: 'Fail', label: 'ไม่ผ่าน / Fail' },
  { value: 'NotApplicable', label: 'N/A' },
]

const EMPLOYER_RESULTS: { value: AdsbEmployerResult; label: string }[] = [
  { value: 'Accepted', label: 'ยอมรับ / Accepted' },
  { value: 'Conditional', label: 'มีเงื่อนไข / Conditional' },
  { value: 'Rejected', label: 'ไม่ยอมรับ / Rejected' },
]

const HW_POINT_OPTIONS: { value: AdsbHwPoint | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'Hold', label: 'Hold Point' },
  { value: 'Witness', label: 'Witness Point' },
]

export function AdsbItemCard({ item, role, editable, onCommit }: AdsbItemCardProps) {
  const isEmployer = role === 'employer'
  const [remark, setRemark] = useState(isEmployer ? (item.employerRemark ?? '') : (item.remark ?? ''))

  function commitRemark() {
    if (isEmployer) {
      if (remark !== (item.employerRemark ?? '')) {
        onCommit(item.no, { employerRemark: remark || undefined })
      }
    } else if (remark !== (item.remark ?? '')) {
      onCommit(item.no, { remark: remark || undefined })
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{item.code}</Badge>
            {!isEmployer &&
              (editable ? (
                <EditableField
                  value={item.resp ?? ''}
                  onCommit={(value) => onCommit(item.no, { resp: value || undefined })}
                  placeholder="Resp."
                  ariaLabel={`${item.name} — resp`}
                  className="h-7 w-24"
                  requireApply
                />
              ) : (
                item.resp && <Badge variant="outline">Resp: {item.resp}</Badge>
              ))}
            {!isEmployer &&
              (editable ? (
                <EditableField
                  value={item.standard ?? ''}
                  onCommit={(value) => onCommit(item.no, { standard: value })}
                  placeholder="Standard"
                  ariaLabel={`${item.name} — standard`}
                  className="h-7 w-40"
                  requireApply
                />
              ) : (
                item.standard && <Badge variant="outline">Std: {item.standard}</Badge>
              ))}
            {isEmployer &&
              (editable ? (
                <EditableField
                  value={item.torRef ?? ''}
                  onCommit={(value) => onCommit(item.no, { torRef: value || undefined })}
                  placeholder="TOR ref"
                  ariaLabel={`${item.name} — TOR ref`}
                  className="h-7 w-24"
                  requireApply
                />
              ) : (
                item.torRef && <Badge variant="outline">TOR: {item.torRef}</Badge>
              ))}
            {isEmployer &&
              (editable ? (
                <Select
                  value={item.hwPoint ?? ''}
                  onValueChange={(value) =>
                    onCommit(item.no, { hwPoint: (value || undefined) as AdsbHwPoint | undefined })
                  }
                >
                  <SelectTrigger size="sm" aria-label={`${item.name} — H/W point`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HW_POINT_OPTIONS.map((option) => (
                      <SelectItem key={option.value || 'none'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                item.hwPoint && (
                  <Badge variant="outline" className={HW_POINT_BADGE_CLASS[item.hwPoint]}>
                    {item.hwPoint} Point
                  </Badge>
                )
              ))}
            {editable && (
              <Select
                value={item.installPhase ?? ''}
                onValueChange={(value) =>
                  onCommit(item.no, { installPhase: value as AdsbInstallPhase })
                }
              >
                <SelectTrigger size="sm" aria-label={`${item.name} — install phase`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADSB_INSTALL_PHASE_DEFS.map((def) => (
                    <SelectItem key={def.id} value={def.id}>
                      {def.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {editable ? (
            <div className="space-y-1">
              <EditableField
                value={item.nameTh ?? ''}
                onCommit={(value) => onCommit(item.no, { nameTh: value })}
                placeholder="ชื่อรายการ (ไทย)"
                ariaLabel={`${item.name} — name (Thai)`}
                className="text-sm font-medium"
                requireApply
              />
              <EditableField
                value={item.name}
                onCommit={(value) => onCommit(item.no, { name: value })}
                placeholder="Item name (EN)"
                ariaLabel={`${item.name} — name`}
                className="text-sm text-muted-foreground"
                requireApply
              />
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">{item.nameTh}</p>
              <p className="text-sm text-muted-foreground">{item.name}</p>
            </div>
          )}

          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-xs font-medium text-muted-foreground">เกณฑ์ยอมรับ / Acceptance criteria</p>
            {editable ? (
              <div className="space-y-1">
                <EditableField
                  as="textarea"
                  value={item.requirementTh ?? ''}
                  onCommit={(value) => onCommit(item.no, { requirementTh: value })}
                  placeholder="เกณฑ์ยอมรับ (ไทย)"
                  ariaLabel={`${item.name} — requirement (Thai)`}
                  requireApply
                />
                <EditableField
                  as="textarea"
                  value={item.requirement}
                  onCommit={(value) => onCommit(item.no, { requirement: value })}
                  placeholder="Acceptance criteria (EN)"
                  ariaLabel={`${item.name} — requirement`}
                  requireApply
                />
              </div>
            ) : (
              <>
                <p className="text-sm">{item.requirementTh}</p>
                <p className="text-sm text-muted-foreground">{item.requirement}</p>
              </>
            )}
          </div>

          {(editable || (isEmployer && (item.requiredEvidence || item.requiredEvidenceTh))) && (
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-xs font-medium text-muted-foreground">หลักฐาน / Required evidence</p>
              {editable ? (
                <div className="space-y-1">
                  <EditableField
                    as="textarea"
                    value={item.requiredEvidenceTh ?? ''}
                    onCommit={(value) => onCommit(item.no, { requiredEvidenceTh: value || undefined })}
                    placeholder="หลักฐาน (ไทย)"
                    ariaLabel={`${item.name} — required evidence (Thai)`}
                    requireApply
                  />
                  <EditableField
                    as="textarea"
                    value={item.requiredEvidence ?? ''}
                    onCommit={(value) => onCommit(item.no, { requiredEvidence: value || undefined })}
                    placeholder="Required evidence (EN)"
                    ariaLabel={`${item.name} — required evidence`}
                    requireApply
                  />
                </div>
              ) : (
                <>
                  {item.requiredEvidenceTh && <p className="text-sm">{item.requiredEvidenceTh}</p>}
                  {item.requiredEvidence && (
                    <p className="text-sm text-muted-foreground">{item.requiredEvidence}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="w-full shrink-0 space-y-2 sm:w-72">
          <div className="flex flex-wrap gap-1">
            {(isEmployer ? EMPLOYER_RESULTS : CONTRACTOR_RESULTS).map((option) => {
              const current = isEmployer ? item.employerResult : item.result
              const isActive = current === option.value
              const badgeClass = isEmployer
                ? EMPLOYER_RESULT_BADGE_CLASS[option.value as AdsbEmployerResult]
                : RESULT_BADGE_CLASS[option.value as AdsbResult]
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={isActive ? badgeClass : undefined}
                  aria-pressed={isActive}
                  onClick={() => {
                    const next = isActive ? undefined : option.value
                    onCommit(
                      item.no,
                      isEmployer
                        ? { employerResult: next as AdsbEmployerResult | undefined }
                        : { result: next as AdsbResult | undefined },
                    )
                  }}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>
          <Textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            onBlur={commitRemark}
            placeholder="หมายเหตุ / Remarks"
            aria-label={`${item.name} — remarks`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
