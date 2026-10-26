import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { AppShell } from './AppShell'
import { ErrorBlock, LoadingBlock } from './RequestStatus'

export interface FromState {
  from?: string
}

export default function RequireAuth() {
  const { state, retrySession } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return <LoadingBlock label="Verificando sesión…" />
  if (state.status === 'error') return <ErrorBlock error={state.error} onRetry={retrySession} />
  if (state.status === 'anonymous') {
    const from = location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={{ from } satisfies FromState} />
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
