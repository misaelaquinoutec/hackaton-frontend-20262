import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1 text-sm ${isActive ? 'bg-amber-400 text-slate-900' : 'hover:bg-white/10'}`

export function AppShell({ children }: { children: ReactNode }) {
  const { state, logout } = useAuth()
  const team = state.status === 'authenticated' ? state.team : null

  return (
    <>
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-8">
        <span className="font-bold">Log Pose Console</span>
        <nav aria-label="Principal" className="flex gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/wanted" className={linkClass}>
            Carteles
          </NavLink>
          <NavLink to="/sagas" className={linkClass}>
            Sagas
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {team && (
            <span>
              {team.name} · <span className="opacity-75">{team.code}</span>
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded border border-white/30 px-3 py-1 hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      {children}
    </>
  )
}
