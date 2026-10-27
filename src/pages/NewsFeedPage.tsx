import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorBlock } from '../components/RequestStatus'
import {
  NEWS_PRIORITIES,
  NEWS_STATUS_LABEL,
  NEWS_STATUSES,
  NEWS_TYPES,
  parseFilters,
  PRIORITY_LABEL,
  toSearchParams,
  TYPE_LABEL,
} from '../lib/newsParams'
import type { NewsFilters } from '../lib/newsParams'
import { getSavedScroll, saveScroll, useNewsFeed } from '../lib/useNewsFeed'
import { STATUS_STYLE } from '../lib/newsStyle'

const df = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
const selectClass = 'rounded border border-white/30 bg-slate-900 px-2 py-2 text-sm'

export default function NewsFeedPage() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const key = useMemo(() => toSearchParams(filters).toString(), [filters])
  const feed = useNewsFeed(key)
  const sentinel = useRef<HTMLDivElement>(null)

  // URL con valores inválidos: se reemplaza por la versión canónica.
  useEffect(() => {
    if (key !== params.toString()) setParams(new URLSearchParams(key), { replace: true })
  }, [key, params, setParams])

  // Al volver del detalle se recupera la posición; al cambiar filtros se sube al inicio.
  const firstKey = useRef(true)
  useLayoutEffect(() => {
    window.scrollTo(0, firstKey.current ? getSavedScroll(key) : 0)
    firstKey.current = false
  }, [key])
  useEffect(() => {
    const onScroll = () => saveScroll(key, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [key])

  // Carga automática al acercarse al final. Se vuelve a observar tras cada carga para
  // que, si el final sigue visible, se pida la siguiente.
  const { loadMore } = feed
  const count = feed.items.length
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadMore(), {
      rootMargin: '400px 0px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, count, feed.loading, feed.error])

  const setFilter = (patch: Partial<NewsFilters>) => setParams(toSearchParams({ ...filters, ...patch }))
  const active = Boolean(filters.type || filters.priority || filters.status)

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="mb-4 text-3xl font-bold">News Coo: Noticias del Mundo</h1>

      <form className="mb-6 flex flex-wrap items-end gap-3" aria-label="Filtros de noticias" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <select
            className={selectClass}
            value={filters.type ?? ''}
            onChange={(e) => setFilter({ type: NEWS_TYPES.find((t) => t === e.target.value) })}
          >
            <option value="">Todos</option>
            {NEWS_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Prioridad
          <select
            className={selectClass}
            value={filters.priority ?? ''}
            onChange={(e) => setFilter({ priority: NEWS_PRIORITIES.find((p) => p === e.target.value) })}
          >
            <option value="">Todas</option>
            {NEWS_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Estado
          <select
            className={selectClass}
            value={filters.status ?? ''}
            onChange={(e) => setFilter({ status: NEWS_STATUSES.find((s) => s === e.target.value) })}
          >
            <option value="">Todos</option>
            {NEWS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {NEWS_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        {active && (
          <button
            type="button"
            className="rounded border border-white/30 px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => setParams(new URLSearchParams())}
          >
            Limpiar filtros
          </button>
        )}
      </form>

      {feed.firstLoading && (
        <ul aria-busy="true" aria-label="Cargando noticias" className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="h-[120px] animate-pulse rounded-xl bg-white/5" />
          ))}
        </ul>
      )}

      {feed.error && feed.items.length === 0 && <ErrorBlock error={feed.error} onRetry={feed.retry} />}

      {!feed.firstLoading && !feed.error && feed.items.length === 0 && (
        <p className="py-12 text-center text-slate-300">No hay noticias con estos filtros.</p>
      )}

      {feed.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {feed.items.map((n) => (
            <li key={n.id}>
              <Link
                to={`/news/${n.id}`}
                className="flex min-h-[120px] flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded px-2 py-0.5 font-medium ${STATUS_STYLE[n.status]}`}>
                    {NEWS_STATUS_LABEL[n.status]}
                  </span>
                  <span className="opacity-75">{TYPE_LABEL[n.type]}</span>
                  <span className="opacity-75">· Prioridad {PRIORITY_LABEL[n.priority].toLowerCase()}</span>
                </span>
                <h2 className="text-lg font-semibold">{n.title}</h2>
                <p className="text-sm opacity-80">{n.summary}</p>
                <span className="mt-auto text-xs opacity-60">
                  {n.source} · {n.island} · {df.format(new Date(n.publishedAt))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {feed.items.length > 0 && (
        <div className="py-6 text-center text-sm" aria-live="polite">
          {feed.loading === 'more' && (
            <p role="status" className="text-slate-300">
              Cargando más noticias…
            </p>
          )}
          {feed.error && (
            <div role="alert" className="flex flex-col items-center gap-2">
              <p className="text-slate-300">{feed.error.message}</p>
              <button
                type="button"
                onClick={feed.retry}
                className="rounded bg-amber-400 px-4 py-2 font-medium text-slate-900 hover:bg-amber-300"
              >
                Reintentar
              </button>
            </div>
          )}
          {!feed.hasMore && !feed.error && <p className="opacity-60">Llegaste al final: no hay más noticias.</p>}
        </div>
      )}
      <div ref={sentinel} aria-hidden="true" className="h-px" />
    </main>
  )
}
