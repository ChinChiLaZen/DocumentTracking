import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { useTrackerStore } from '../../store/useTrackerStore'
import { selectAllProjectsSummary } from '../../store/selectors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { AddProjectDialog } from './AddProjectDialog'
import { findCsiEntry, formatCsiEntry } from '../../data/csiMasterFormat'

export function ProjectsSummaryPage() {
  const projects = useTrackerStore((s) => s.projects)
  const projectOrder = useTrackerStore((s) => s.projectOrder)
  const summaries = selectAllProjectsSummary({ projects, projectOrder })

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Vendor Approval / Material Approval Request tracking, by project.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddProjectDialog />
          <UserButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map(({ meta, done, total, percent }) => {
          const csiEntry = findCsiEntry(meta.projectType)
          return (
            <Link key={meta.id} to={`/projects/${meta.id}`} className="block">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{meta.title}</CardTitle>
                  <CardDescription>
                    {meta.vendor} · {meta.scope}
                    {csiEntry && <> · {formatCsiEntry(csiEntry)}</>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-1 text-sm">
                    {done} of {total} items submitted ({percent}%)
                  </p>
                  <Progress value={percent} />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
