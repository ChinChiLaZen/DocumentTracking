import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useUsersStore } from '../../store/useUsersStore'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

function formatJoinedDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.user)
  const { users, loading, error, fetchUsers, updateRole } = useUsersStore()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="text-lg font-semibold">User Management</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Manage sign-in access and admin privileges for everyone who has created an account.
      </p>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.email === currentUser.email
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
                      onValueChange={(value) => updateRole(user.id, value as 'admin' | 'member')}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Team member</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatJoinedDate(user.createdAt)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
