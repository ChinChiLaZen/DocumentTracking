import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useTeamStore } from '../../store/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

const STAT_LABELS: { key: 'toDo' | 'inProgress' | 'awaitingReview' | 'done'; label: string }[] = [
  { key: 'toDo', label: 'To Do' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'awaitingReview', label: 'Awaiting Review' },
  { key: 'done', label: 'Done' },
]

export function TeamPage() {
  const role = useAuthStore((s) => s.user?.role)
  const { team, loading, error, fetchTeam } = useTeamStore()

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  if (role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="text-lg font-semibold">Team</h1>
      <p className="mb-6 text-sm text-muted-foreground">Task overview for every teammate.</p>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="text-sm">{member.email}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-2 text-center">
                {STAT_LABELS.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-lg font-semibold">{member.counts[key]}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
