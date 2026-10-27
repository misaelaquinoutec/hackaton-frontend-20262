import { Link } from 'react-router-dom'
import { ErrorBlock, LoadingBlock } from '../components/RequestStatus'
import { getSagas } from '../lib/sagas'
import { useRequest } from '../lib/useRequest'

const nf = new Intl.NumberFormat('es-ES')

export default function SagasPage() {
  const [state, retry] = useRequest((signal) => getSagas(signal), [])

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <h1 className="mb-6 text-3xl font-bold">Poneglyph: las Grandes Sagas</h1>
      {state.status === 'loading' && <LoadingBlock label="Descifrando los Poneglyphs…" />}
      {state.status === 'error' && <ErrorBlock error={state.error} onRetry={retry} />}
      {state.status === 'success' &&
        (state.data.length === 0 ? (
          <p className="text-slate-300">Aún no hay sagas disponibles.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {[...state.data]
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/sagas/${s.id}`}
                    viewTransition
                    className="flex h-full flex-col gap-2 rounded-xl border-2 p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      background: s.palette.background,
                      color: s.palette.text,
                      borderColor: s.palette.primary,
                      viewTransitionName: `saga-${s.id}`,
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: s.palette.primary }}>
                      Saga {s.order}
                    </span>
                    <h2 className="text-xl font-bold">{s.title}</h2>
                    <p className="italic opacity-80">{s.subtitle}</p>
                    <p className="opacity-90">{s.synopsis}</p>
                    <p className="mt-auto pt-2 text-sm opacity-80">
                      {s.stageCount} etapas · {nf.format(s.totalDistanceNm)} mn · {s.firstIsland} → {s.lastIsland}
                    </p>
                  </Link>
                </li>
              ))}
          </ul>
        ))}
    </main>
  )
}
