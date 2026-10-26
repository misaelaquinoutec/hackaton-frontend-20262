import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginResponse, MeResponse, Team, User } from '../types/auth'
import { ApiError, apiFetch, clearToken, getToken, setToken, setUnauthorizedHandler } from './api'

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'error'; error: ApiError }
  | { status: 'authenticated'; user: User; team: Team }

interface AuthContextValue {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  register: (teamName: string, email: string, password: string) => Promise<void>
  logout: () => void
  retrySession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    getToken() ? { status: 'loading' } : { status: 'anonymous' },
  )
  const [attempt, setAttempt] = useState(0)

  // Restaura la sesión al cargar: no se muestra el login mientras se verifica.
  useEffect(() => {
    if (!getToken()) return
    const controller = new AbortController()
    setState({ status: 'loading' })
    apiFetch<MeResponse>('/auth/me', { signal: controller.signal })
      .then((me) => {
        if (!controller.signal.aborted) setState({ status: 'authenticated', user: me.user, team: me.team })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          setState({ status: 'anonymous' })
        } else if (err instanceof ApiError) {
          setState({ status: 'error', error: err })
        }
      })
    return () => controller.abort()
  }, [attempt])

  // Si la sesión deja de ser válida en cualquier request, se vuelve al login.
  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'anonymous' }))
    return () => setUnauthorizedHandler(null)
  }, [])

  const startSession = useCallback((res: LoginResponse) => {
    setToken(res.token)
    setState({ status: 'authenticated', user: res.user, team: res.team })
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      startSession(res)
    },
    [startSession],
  )

  const register = useCallback(
    async (teamName: string, email: string, password: string) => {
      const res = await apiFetch<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ teamName, email, password }),
      })
      startSession(res)
    },
    [startSession],
  )

  const logout = useCallback(() => {
    clearToken()
    setState({ status: 'anonymous' })
  }, [])

  const retrySession = useCallback(() => setAttempt((n) => n + 1), [])

  const value = useMemo(
    () => ({ state, login, register, logout, retrySession }),
    [state, login, register, logout, retrySession],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
