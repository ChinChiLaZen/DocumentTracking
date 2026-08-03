import { useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import {
  EMPLOYER_RESULT_BADGE_CLASS,
  HW_POINT_BADGE_CLASS,
  RESULT_BADGE_CLASS,
} from '../shared/statusStyles'
import type { AdsbEmployerResult, AdsbResult, Item } from '../../data/types'
import type { ItemMetaPatch } from '../../store/useTrackerStore'

interface AdsbItemCardProps {
  item: Item
  role: 'contractor' | 'employer'
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

export function AdsbItemCard({ item, role, onCommit }: AdsbItemCardProps) {
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
            {!isEmployer && item.resp && <Badge variant="outline">Resp: {item.resp}</Badge>}
            {!isEmployer && item.standard && <Badge variant="outline">Std: {item.standard}</Badge>}
            {isEmployer && item.torRef && <Badge variant="outline">TOR: {item.torRef}</Badge>}
            {isEmployer && item.hwPoint && (
              <Badge variant="outline" className={HW_POINT_BADGE_CLASS[item.hwPoint]}>
                {item.hwPoint} Point
              </Badge>
            )}
          </div>

          <div>
            <p className="text-sm font-medium">{item.nameTh}</p>
            <p className="text-sm text-muted-foreground">{item.name}</p>
          </div>

          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-xs font-medium text-muted-foreground">เกณฑ์ยอมรับ / Acceptance criteria</p>
            <p className="text-sm">{item.requirementTh}</p>
            <p className="text-sm text-muted-foreground">{item.requirement}</p>
          </div>

          {isEmployer && (item.requiredEvidence || item.requiredEvidenceTh) && (
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-xs font-medium text-muted-foreground">หลักฐาน / Required evidence</p>
              {item.requiredEvidenceTh && <p className="text-sm">{item.requiredEvidenceTh}</p>}
              {item.requiredEvidence && (
                <p className="text-sm text-muted-foreground">{item.requiredEvidence}</p>
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
