import { CalendarClock, Circle, Flag, Pencil, Trash2, Users } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { computeDateRange, datePercent, durationDays, monthTicks, phaseBarStyle } from '../../domain/schedule'
import { MILESTONE_TYPE_BADGE_CLASS } from '../shared/statusStyles'
import type { MilestoneType, ScheduleMilestone, SchedulePhase } from '../../data/types'

const ROW_HEIGHT = 'h-10'
const TRACK_HEIGHT = 'h-8'
const MIN_PX_PER_MONTH_TICK = 90
const MIN_TIMELINE_WIDTH_PX = 720

const MILESTONE_ICON: Record<MilestoneType, typeof Flag> = {
  Delivery: Flag,
  Committee: Users,
  Extension: CalendarClock,
  Other: Circle,
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return DATE_FORMAT.format(date)
}

interface GanttChartProps {
  phases: SchedulePhase[]
  milestones: ScheduleMilestone[]
  contractStartDate?: string
  canEdit: boolean
  onEditPhase(phase: SchedulePhase): void
  onDeletePhase(phaseId: string): void
  onEditMilestone(milestone: ScheduleMilestone): void
  onDeleteMilestone(milestoneId: string): void
}

export function GanttChart({
  phases,
  milestones,
  contractStartDate,
  canEdit,
  onEditPhase,
  onDeletePhase,
  onEditMilestone,
  onDeleteMilestone,
}: GanttChartProps) {
  const range = computeDateRange(phases, milestones, contractStartDate)

  if (!range) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No schedule data yet. Add a phase or milestone to get started.
      </div>
    )
  }

  const ticks = monthTicks(range)
  const contractStartPercent = contractStartDate
    ? datePercent(new Date(`${contractStartDate}T00:00:00`), range)
    : undefined
  // Enough width for every month tick's label to have breathing room —
  // otherwise adjacent labels overlap when the range spans many months.
  const timelineWidthPx = Math.max(MIN_TIMELINE_WIDTH_PX, ticks.length * MIN_PX_PER_MONTH_TICK)

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {/* Left panel — phase list, row heights must match the timeline rows on the right. */}
        <div className="w-64 shrink-0">
          <div className={`${TRACK_HEIGHT} border-b`} />
          <div className={`${TRACK_HEIGHT} border-b`} />
          {phases.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">No phases yet.</p>
          )}
          {phases.map((phase) => (
            <div key={phase.id} className={`${ROW_HEIGHT} flex items-center gap-2 border-b`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                  <span className="truncate">{phase.name}</span>
                  {phase.code && (
                    <Badge variant="outline" className="shrink-0">
                      {phase.code}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{durationDays(phase)}d</span>
                  <Progress value={phase.percentComplete} className="w-16" />
                  <span>{phase.percentComplete}%</span>
                </div>
              </div>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Edit ${phase.name}`}
                    onClick={() => onEditPhase(phase)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete ${phase.name}`}
                    onClick={() => onDeletePhase(phase.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right panel — month-tick header, milestone track, and phase bars, all positioned by date percentage. */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="relative" style={{ width: `${timelineWidthPx}px` }}>
            {contractStartPercent !== undefined && (
              <div
                className="pointer-events-none absolute inset-y-0 border-l border-dashed border-muted-foreground/40"
                style={{ left: `${contractStartPercent}%` }}
                aria-hidden
              />
            )}

            <div className={`relative ${TRACK_HEIGHT} border-b`}>
              {ticks.map((tick) => (
                <span
                  key={tick.label}
                  className="absolute top-1/2 -translate-y-1/2 border-l pl-1 text-xs text-muted-foreground"
                  style={{ left: `${tick.percent}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>

            <TooltipProvider>
              <div className={`relative ${TRACK_HEIGHT} border-b`}>
                {milestones.map((milestone) => {
                  const Icon = MILESTONE_ICON[milestone.type]
                  const percent = datePercent(new Date(`${milestone.date}T00:00:00`), range)
                  return (
                    <Tooltip key={milestone.id}>
                      <TooltipTrigger asChild>
                        <span
                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                          style={{ left: `${percent}%` }}
                        >
                          <Icon className="size-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {milestone.label} · {formatDate(milestone.date)}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>

            {phases.length === 0 && <div className={`${ROW_HEIGHT} border-b`} />}
            {phases.map((phase) => {
              const { leftPercent, widthPercent } = phaseBarStyle(phase, range)
              return (
                <div key={phase.id} className={`relative ${ROW_HEIGHT} border-b`}>
                  <div
                    className="absolute top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded bg-muted"
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  >
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${phase.percentComplete}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Milestone list — visual markers above are hover-only, so edit/delete
          controls live here instead. */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Milestones</h3>
        {milestones.length === 0 && <p className="text-sm text-muted-foreground">No milestones yet.</p>}
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex items-center gap-3 rounded-md border px-3 py-1.5 text-sm"
          >
            <span className="min-w-0 flex-1 truncate">{milestone.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(milestone.date)}</span>
            <Badge variant="outline" className={`shrink-0 ${MILESTONE_TYPE_BADGE_CLASS[milestone.type]}`}>
              {milestone.type}
            </Badge>
            {canEdit && (
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Edit ${milestone.label}`}
                  onClick={() => onEditMilestone(milestone)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${milestone.label}`}
                  onClick={() => onDeleteMilestone(milestone.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
