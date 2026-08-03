import { Link } from 'react-router-dom'
import { useTrackerStore } from '../../store/useTrackerStore'
import { useAuthStore } from '../../store/useAuthStore'
import { selectAllProjectsSummary } from '../../store/selectors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { AddProjectDialog } from './AddProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { UserMenu } from '../auth/UserMenu'
import { findCsiEntry, formatCsiEntry } from '../../data/csiMasterFormat'

export function ProjectsListPage() {
  const projects = useTrackerStore((s) => s.projects)
  const projectOrder = useTrackerStore((s) => s.projectOrder)
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin'
  const summaries = selectAllProjectsSummary({ projects, projectOrder })

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Every MAR review in flight.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddProjectDialog />
          <UserMenu />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map(({ meta, done, total, percent }) => {
          const csiEntry = findCsiEntry(meta.projectType)
          return (
            <div key={meta.id} className="relative">
              <Link to={`/projects/${meta.id}`} className="block">
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
              {isAdmin && (
                <div className="absolute top-2 right-2 z-10">
                  <DeleteProjectDialog projectId={meta.id} title={meta.title} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
