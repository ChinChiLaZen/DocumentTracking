import { Input } from '../ui/input'
import { Progress } from '../ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { PHASE_COLOR_SLOTS } from '../shared/statusStyles'
import { phaseColorIndex } from '../../domain/schedule'
import { summarizeBoq } from '../../domain/boq'
import type { BoqEstimate } from '../../data/types'

interface BoqSummaryCardProps {
  boq: BoqEstimate
  canEdit: boolean
  onVatPercentChange(value: number): void
}

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function formatCurrency(value: number): string {
  return CURRENCY_FORMAT.format(value)
}

/** Subtotal/VAT/net total plus a per-category share breakdown, colored via
 *  the same PHASE_COLOR_SLOTS palette Project Management uses for phases —
 *  same palette/hashing utility for a stable per-id color, not a claim that
 *  BOQ categories and schedule phases are the same underlying entity. */
export function BoqSummaryCard({ boq, canEdit, onVatPercentChange }: BoqSummaryCardProps) {
  const summary = summarizeBoq(boq)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(summary.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>VAT</span>
              <Input
                type="number"
                min={0}
                className="h-6 w-14 text-xs"
                value={boq.vatPercent}
                disabled={!canEdit}
                aria-label="VAT percent"
                onChange={(e) => onVatPercentChange(Number(e.target.value) || 0)}
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span>{formatCurrency(summary.vatAmount)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-1 font-semibold">
            <span>Net Total</span>
            <span>{formatCurrency(summary.netTotal)}</span>
          </div>
        </div>

        {summary.categoryShares.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Category share</p>
            {summary.categoryShares.map((share) => {
              const color = PHASE_COLOR_SLOTS[phaseColorIndex(share.categoryId)]
              return (
                <div key={share.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{share.name}</span>
                    <span className="text-muted-foreground">{share.percent.toFixed(1)}%</span>
                  </div>
                  <Progress value={share.percent} indicatorClassName={color.fill} />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
