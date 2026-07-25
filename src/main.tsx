import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import { shadcn } from '@clerk/ui/themes'
import './index.css'
import { router } from './routes.tsx'

const rootElement = document.getElementById('root')!
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  createRoot(rootElement).render(
    <div className="flex h-svh items-center justify-center p-6 text-center">
      <p className="max-w-md text-sm text-muted-foreground">
        Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code>. Copy <code>.env.example</code> to{' '}
        <code>.env</code> and set your Clerk publishable key, then restart the dev server.
      </p>
    </div>,
  )
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkPublishableKey} appearance={{ theme: shadcn }}>
        <RouterProvider router={router} />
      </ClerkProvider>
    </StrictMode>,
  )
}
