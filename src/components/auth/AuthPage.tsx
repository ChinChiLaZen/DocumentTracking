import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useAuthStore } from '../../store/useAuthStore'

type Mode = 'sign-in' | 'sign-up'

export function AuthPage() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result =
      mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password, inviteCode)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="flex h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ITS Tracker</CardTitle>
          <CardDescription>Document tracking system for the project.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              <TabsTrigger value="sign-up">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value={mode} className="mt-4">
              <form onSubmit={handleSubmit} className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="auth-password">Password</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {mode === 'sign-up' && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="auth-invite">Invite code</Label>
                    <Input
                      id="auth-invite"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={submitting} className="mt-1">
                  {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
