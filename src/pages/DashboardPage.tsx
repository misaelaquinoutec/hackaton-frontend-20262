import { ErrorBlock, LoadingBlock } from '../components/RequestStatus'
import { apiFetch } from '../lib/api'
import { useRequest } from '../lib/useRequest'
import type { DashboardSummary, LogPose } from '../types/auth'

const nf = new Intl.NumberFormat('es-ES')

const statusLabel = { AT_LARGE: 'Libres', CAPTURED: 'Capturados', MISSING: 'Desaparecidos' } as const
const fruitLabel = { PARAMECIA: 'Paramecia', ZOAN: 'Zoan', LOGIA: 'Logia', NONE: 'Sin fruta' } as const

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-4">
      <dt className="text-sm opacity-75">{label}</dt>
      <dd className="text-2xl font-semibold text-amber-300">{value}</dd>
    </div>
  )
}

function LogPoseCard() {
  const [state, retry] = useRequest((signal) => apiFetch<LogPose>('/log-pose', { signal }), [])
  return (
    <section aria-labelledby="logpose-title" className="rounded-lg border border-white/20 p-4">
      <h2 id="logpose-title" className="mb-2 text-lg font-semibold">
        Log Pose
      </h2>
      {state.status === 'loading' && <p role="status">Consultando el Log Pose…</p>}
      {state.status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-3">
          <p>{state.error.message}</p>
          <button type="button" onClick={retry} className="rounded bg-amber-400 px-3 py-1 text-slate-900">
            Reintentar
          </button>
        </div>
      )}
      {state.status === 'success' && (
        <>
          <p className="font-medium">
            {state.data.grandLineUnlocked ? '🔓 Desbloqueado' : '🔒 Bloqueado'} ·{' '}
            {state.data.grandLineUnlocked ? 'Grand Line abierto' : 'Grand Line cerrado'}
          </p>
          <p className="opacity-80">{state.data.message}</p>
          {state.data.unlockedAt && (
            <p className="text-sm opacity-70">Desde {new Date(state.data.unlockedAt).toLocaleString('es-ES')}</p>
          )}
        </>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const [state, retry] = useRequest((signal) => apiFetch<DashboardSummary>('/dashboard/summary', { signal }), [])

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-3xl font-bold">Dashboard de la tripulación</h1>
      <LogPoseCard />

      {state.status === 'loading' && <LoadingBlock label="Cargando indicadores…" />}
      {state.status === 'error' && <ErrorBlock error={state.error} onRetry={retry} />}
      {state.status === 'success' && state.data.wanted.total === 0 && (
        <p className="rounded-lg bg-white/5 p-6 text-center">Tu workspace aún no tiene carteles de "Se Busca".</p>
      )}
      {state.status === 'success' && state.data.wanted.total > 0 && <Summary data={state.data} />}
    </main>
  )
}

function Summary({ data }: { data: DashboardSummary }) {
  const { wanted, crews, topBounties } = data
  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Carteles" value={nf.format(wanted.total)} />
        <Stat label="Recompensa total" value={`${nf.format(wanted.totalBounty)} ฿`} />
        <Stat label="Recompensa promedio" value={`${nf.format(wanted.averageBounty)} ฿`} />
        <Stat label="Tripulaciones" value={nf.format(crews.total)} />
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="by-status" className="rounded-lg bg-white/5 p-4">
          <h2 id="by-status" className="mb-2 font-semibold">
            Por estado
          </h2>
          <ul>
            {(Object.keys(statusLabel) as (keyof typeof statusLabel)[]).map((k) => (
              <li key={k} className="flex justify-between">
                <span>{statusLabel[k]}</span> <span>{wanted.byStatus[k]}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="by-fruit" className="rounded-lg bg-white/5 p-4">
          <h2 id="by-fruit" className="mb-2 font-semibold">
            Por fruta del diablo
          </h2>
          <ul>
            {(Object.keys(fruitLabel) as (keyof typeof fruitLabel)[]).map((k) => (
              <li key={k} className="flex justify-between">
                <span>{fruitLabel[k]}</span> <span>{wanted.byFruit[k]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {crews.mostWanted && (
        <section aria-labelledby="most-wanted" className="rounded-lg bg-white/5 p-4">
          <h2 id="most-wanted" className="mb-1 font-semibold">
            Tripulación más buscada
          </h2>
          <p>
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-3 w-3 rounded-full"
              style={{ background: crews.mostWanted.jollyRogerColor }}
            />
            {crews.mostWanted.name} · {crews.mostWanted.shipName} · {crews.mostWanted.memberCount} miembros ·{' '}
            {nf.format(crews.mostWanted.totalBounty)} ฿
          </p>
        </section>
      )}

      <section aria-labelledby="top" className="rounded-lg bg-white/5 p-4">
        <h2 id="top" className="mb-2 font-semibold">
          Mayores recompensas
        </h2>
        <ol className="flex flex-col gap-1">
          {topBounties.map((w) => (
            <li key={w.id} className="flex justify-between gap-4">
              <span>
                {w.name} <span className="opacity-70">“{w.epithet}”</span>
              </span>
              <span className="font-medium">{nf.format(w.bounty)} ฿</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
