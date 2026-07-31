import { Button } from '../ui/button'
import { useAuthStore } from '../../store/useAuthStore'

/** `dark` renders against a dark header band (e.g. ProjectShell); default suits a light background (e.g. ProjectsSummaryPage). */
export function UserMenu({ dark = false }: { dark?: boolean }) {
  const email = useAuthStore((s) => s.user?.email)
  const signOut = useAuthStore((s) => s.signOut)

  if (!email) return null

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{email}</span>
      <Button
        variant="ghost"
        size="sm"
        className={dark ? 'text-white/80 hover:bg-white/10' : undefined}
        onClick={() => signOut()}
      >
        Sign out
      </Button>
    </div>
  )
}
