import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore, type Role } from '../../store/useAuthStore'
import { useUsersStore, ROLES, ROLE_LABEL } from '../../store/useUsersStore'
import { useTeamStore } from '../../store/useTeamStore'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ACCOUNT_STATUS_BADGE_CLASS } from '../shared/statusStyles'
import { AddUserDialog } from './AddUserDialog'
import { EditUserDialog } from './EditUserDialog'
import { DeactivateUserDialog } from './DeactivateUserDialog'
import { DeleteUserDialog } from './DeleteUserDialog'

function formatJoinedDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.user)
  const { users, loading, error, fetchUsers, updateRole, setActive, deleteUser } = useUsersStore()
  const { team, fetchTeam } = useTeamStore()
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchTeam()
  }, [fetchUsers, fetchTeam])

  const countsById = useMemo(() => new Map(team.map((member) => [member.id, member.counts])), [team])

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const q = query.trim().toLowerCase()
  const visibleUsers = q ? users.filter((u) => u.email.toLowerCase().includes(q)) : users

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="text-lg font-semibold">User Management</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Manage sign-in access and admin privileges for everyone who has created an account.
      </p>

      <div className="mb-4 flex items-center justify-between gap-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          className="max-w-sm"
        />
        <AddUserDialog />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tasks (To Do / In Progress / Awaiting / Done)</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleUsers.map((user) => {
              const isSelf = user.email === currentUser.email
              const counts = countsById.get(user.id)
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.email}
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={isSelf}
                      onValueChange={(value) => updateRole(user.id, value as Role)}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABEL[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        ACCOUNT_STATUS_BADGE_CLASS[user.isActive ? 'Active' : 'Deactivated']
                      }
                    >
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {counts ? `${counts.toDo} / ${counts.inProgress} / ${counts.awaitingReview} / ${counts.done}` : '—'}
                  </TableCell>
                  <TableCell>{formatJoinedDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <EditUserDialog id={user.id} email={user.email} />
                        {user.isActive ? (
                          <DeactivateUserDialog
                            email={user.email}
                            onConfirm={() => setActive(user.id, false)}
                          />
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setActive(user.id, true)}>
                            Reactivate
                          </Button>
                        )}
                        <DeleteUserDialog
                          email={user.email}
                          onConfirm={() => deleteUser(user.id)}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
