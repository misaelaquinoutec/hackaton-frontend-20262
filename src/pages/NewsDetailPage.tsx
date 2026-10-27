import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorBlock, LoadingBlock } from '../components/RequestStatus'
import { ApiError, apiFetch } from '../lib/api'
import { NEWS_STATUS_LABEL, PRIORITY_LABEL, TYPE_LABEL } from '../lib/newsParams'
import { STATUS_STYLE } from '../lib/newsStyle'
import { applyVerification } from '../lib/useNewsFeed'
import { useRequest } from '../lib/useRequest'
import type { NewsDetail } from '../types/news'

const df = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' })

type Target = 'CONFIRMED' | 'DEBUNKED'
type Verify =
  | { phase: 'idle' }
  | { phase: 'pending'; target: Target }
  | { phase: 'done' }
  | { phase: 'error'; message: string }

export default function NewsDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [state, retry] = useRequest((signal) => apiFetch<NewsDetail>(`/news/${encodeURIComponent(id)}`, { signal }), [id])

  useEffect(() => window.scrollTo(0, 0), [id])

  // Volver con "atrás" deja el feed con sus filtros, noticias y posición.
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/news'))

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-8">
      <div>
        <button type="button" onClick={back} className="text-sm underline">
          ← Volver a las noticias
        </button>
      </div>
      {state.status === 'loading' && <LoadingBlock label="Cargando noticia…" />}
      {state.status === 'error' && (
        <>
          <ErrorBlock error={state.error} onRetry={retry} notFound="No encontramos esta noticia" />
          {state.error.status === 404 && (
            <Link to="/news" className="text-center underline">
              Ver todas las noticias
            </Link>
          )}
        </>
      )}
      {state.status === 'success' && <Article key={state.data.id} initial={state.data} />}
    </main>
  )
}

function Article({ initial }: { initial: NewsDetail }) {
  const [news, setNews] = useState(initial)
  const [verify, setVerify] = useState<Verify>({ phase: 'idle' })
  const pending = verify.phase === 'pending'

  const submit = async (target: Target) => {
    if (pending) return
    setVerify({ phase: 'pending', target })
    try {
      const updated = await apiFetch<NewsDetail>(`/news/${encodeURIComponent(news.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: target }),
      })
      applyVerification(updated)
      setNews(updated)
      setVerify({ phase: 'done' })
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'NEWS_ALREADY_VERIFIED'
          ? 'Esta noticia ya fue verificada con otro estado. Vuelve al feed para ver su estado actual.'
          : err instanceof ApiError
            ? err.message
            : 'No se pudo verificar la noticia.'
      // El estado mostrado no cambia: sigue siendo el anterior.
      setVerify({ phase: 'error', message })
    }
  }

  return (
    <article className="flex flex-col gap-4">
      <header>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`rounded px-2 py-0.5 font-medium ${STATUS_STYLE[news.status]}`}>
            {NEWS_STATUS_LABEL[news.status]}
          </span>
          <span className="opacity-75">{TYPE_LABEL[news.type]}</span>
          <span className="opacity-75">· Prioridad {PRIORITY_LABEL[news.priority].toLowerCase()}</span>
        </p>
        <h1 className="mt-2 text-3xl font-bold">{news.title}</h1>
        <p className="mt-1 text-sm opacity-70">
          {news.source} · {news.island} · {df.format(new Date(news.publishedAt))}
        </p>
        {news.verifiedAt && <p className="text-sm opacity-70">Verificada el {df.format(new Date(news.verifiedAt))}</p>}
      </header>

      <p className="text-lg italic opacity-90">{news.summary}</p>
      {news.body.map((para, i) => (
        <p key={i} className="max-w-prose leading-relaxed">
          {para}
        </p>
      ))}
      {news.relatedWanted && (
        <p>
          Cartel relacionado:{' '}
          <Link to={`/wanted/${news.relatedWanted.id}`} className="underline">
            {news.relatedWanted.name}
          </Link>
        </p>
      )}

      {news.status === 'RUMOR' && (
        <section aria-labelledby="verify" className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 id="verify" className="font-semibold">
            Verificar este rumor
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => submit('CONFIRMED')}
              className="rounded bg-emerald-400 px-4 py-2 font-medium text-slate-900 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && verify.target === 'CONFIRMED' ? 'Confirmando…' : 'Confirmar'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => submit('DEBUNKED')}
              className="rounded bg-rose-400 px-4 py-2 font-medium text-slate-900 hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && verify.target === 'DEBUNKED' ? 'Desmintiendo…' : 'Desmentir'}
            </button>
          </div>
          {verify.phase === 'error' && (
            <div role="alert" className="text-rose-200">
              <p>{verify.message}</p>
              <p className="text-sm opacity-80">La noticia sigue como rumor. Puedes intentarlo de nuevo.</p>
            </div>
          )}
        </section>
      )}
      <p role="status" className="min-h-6 text-emerald-200">
        {verify.phase === 'done' && `Listo: la noticia quedó como ${NEWS_STATUS_LABEL[news.status].toLowerCase()}.`}
      </p>
    </article>
  )
}
