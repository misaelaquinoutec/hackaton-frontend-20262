import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorBlock, LoadingBlock } from '../components/RequestStatus'
import { apiFetch } from '../lib/api'
import { useRequest } from '../lib/useRequest'
import { FRUIT_LABEL, STATUS_LABEL } from '../lib/wantedParams'
import type { WantedDetail } from '../types/wanted'

const nf = new Intl.NumberFormat('es-ES')
const df = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' })

export default function WantedDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [state, retry] = useRequest(
    (signal) => apiFetch<WantedDetail>(`/wanted/${encodeURIComponent(id)}`, { signal }),
    [id],
  )

  // Volver con "atrás" conserva el listado tal como estaba (filtros, página y scroll).
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/wanted'))

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-8">
      <div>
        <button type="button" onClick={back} className="text-sm underline">
          ← Volver a los carteles
        </button>
      </div>

      {state.status === 'loading' && <LoadingBlock label="Cargando cartel…" />}
      {state.status === 'error' && (
        <>
          <ErrorBlock error={state.error} onRetry={retry} notFound="No encontramos este cartel" />
          {state.error.status === 404 && (
            <Link to="/wanted" className="text-center underline">
              Ver todos los carteles
            </Link>
          )}
        </>
      )}
      {state.status === 'success' && <Detail w={state.data} />}
    </main>
  )
}

function Detail({ w }: { w: WantedDetail }) {
  const max = Math.max(...w.bountyHistory.map((h) => h.amount), 1)
  return (
    <article className="flex flex-col gap-4">
      <header>
        <h1 className="text-3xl font-bold">{w.name}</h1>
        <p className="italic opacity-80">“{w.epithet}”</p>
        <p className="mt-2 text-2xl font-semibold text-amber-300">{nf.format(w.bounty)} ฿</p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ['Estado', STATUS_LABEL[w.status]],
          ['Tripulación', w.crew.name],
          ['Rol', w.role],
          ['Fruta del diablo', w.devilFruit ? `${w.devilFruit.name} (${FRUIT_LABEL[w.devilFruit.type]})` : 'Ninguna'],
          ['Amenaza', `${w.threatLevel}/5`],
          ['Edad', `${w.age} años`],
          ['Altura', `${w.heightCm} cm`],
          ['Visto por última vez', `${w.lastSeen.island} · ${df.format(new Date(w.lastSeen.seenAt))}`],
          ['Actualizado', df.format(new Date(w.updatedAt))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white/5 p-3">
            <dt className="text-xs opacity-70">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="max-w-prose leading-relaxed">{w.bio}</p>

      <section aria-labelledby="history">
        <h2 id="history" className="mb-2 text-lg font-semibold">
          Historial de recompensas
        </h2>
        <ol className="flex flex-col gap-2">
          {w.bountyHistory.map((h) => (
            <li key={h.issuedAt} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 opacity-75">{df.format(new Date(h.issuedAt))}</span>
              <span className="h-3 rounded bg-amber-400" style={{ width: `${(h.amount / max) * 100}%`, minWidth: 4 }} />
              <span className="shrink-0 font-medium">{nf.format(h.amount)} ฿</span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}
