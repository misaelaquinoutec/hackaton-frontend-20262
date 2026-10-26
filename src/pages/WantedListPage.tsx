import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useRequest } from '../lib/useRequest'
import { useWantedList } from '../lib/useWantedList'
import {
  FRUIT_LABEL,
  FRUITS,
  parseQuery,
  SIZES,
  SORT_LABEL,
  SORTS,
  STATUS_LABEL,
  STATUSES,
  toSearchParams,
} from '../lib/wantedParams'
import type { Size, Sort, WantedQuery } from '../lib/wantedParams'
import type { Crew, FruitType, WantedStatus, WantedSummary } from '../types/wanted'

const nf = new Intl.NumberFormat('es-ES')
const SEARCH_DEBOUNCE_MS = 400
const SCROLL_KEY = 'wanted-scroll'
const ROW_MIN_HEIGHT = 'min-h-[84px]'

const selectClass = 'rounded border border-white/30 bg-slate-900 px-2 py-2 text-sm'

export default function WantedListPage() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseQuery(params), [params])
  const key = useMemo(() => toSearchParams(query).toString(), [query])
  const [list, retry] = useWantedList(key)
  const [crewsState] = useRequest((signal) => apiFetch<Crew[]>('/crews', { signal }), [])

  const commit = (next: WantedQuery, replace = false) =>
    setParams(toSearchParams(next), { replace })

  // Cambiar filtros, búsqueda, orden o tamaño siempre vuelve a la primera página.
  const change = (patch: Partial<WantedQuery>, replace = false) => commit({ ...query, ...patch, page: 0 }, replace)

  // La URL es la fuente de verdad: si trae valores inválidos se reemplaza por la versión canónica.
  useEffect(() => {
    if (key !== params.toString()) setParams(new URLSearchParams(key), { replace: true })
  }, [key, params, setParams])

  // Si la página pedida ya no existe, llevar a la última que sí existe.
  const data = list.data
  useEffect(() => {
    if (list.status !== 'success' || !data || data.page !== query.page) return
    if (data.content.length === 0 && data.totalPages > 0 && query.page >= data.totalPages) {
      commit({ ...query, page: data.totalPages - 1 }, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.status, data])

  // Búsqueda con debounce: una request por pausa, no por tecla.
  const [qInput, setQInput] = useState(query.q)
  const committedQ = useRef(query.q)
  useEffect(() => {
    if (query.q !== committedQ.current) {
      committedQ.current = query.q
      setQInput(query.q)
    }
  }, [query.q])
  useEffect(() => {
    const value = qInput.trim()
    if (value === committedQ.current) return
    const t = setTimeout(() => {
      committedQ.current = value
      change({ q: value }, true)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    const value = qInput.trim()
    committedQ.current = value
    if (value !== query.q) change({ q: value }, true)
  }

  // Al volver del detalle, recuperar la posición del scroll.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current || list.status !== 'success') return
    restored.current = true
    try {
      const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? 'null') as { key: string; y: number } | null
      if (saved && saved.key === key) window.scrollTo(0, saved.y)
      sessionStorage.removeItem(SCROLL_KEY)
    } catch {
      /* sessionStorage no disponible */
    }
  }, [list.status, key])
  const rememberScroll = () => {
    try {
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ key, y: window.scrollY }))
    } catch {
      /* ignorar */
    }
  }

  const crews = crewsState.status === 'success' ? crewsState.data : []
  const loading = list.status === 'loading'
  const hasFilters = Boolean(query.status || query.crewId || query.fruit || query.q)
  const totalPages = data?.totalPages ?? 0

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:p-8">
      <h1 className="text-3xl font-bold">Carteles de “Se Busca”</h1>

      <form onSubmit={submitSearch} role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar por nombre o epíteto
        </label>
        <input
          id="q"
          type="search"
          value={qInput}
          maxLength={100}
          placeholder="Buscar por nombre o epíteto"
          onChange={(e) => setQInput(e.target.value)}
          className="min-w-0 flex-1 rounded border border-white/30 bg-slate-900 px-3 py-2"
        />
      </form>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs">
          Estado
          <select
            className={selectClass}
            value={query.status ?? ''}
            onChange={(e) => change({ status: (STATUSES.find((s) => s === e.target.value) as WantedStatus | undefined) })}
          >
            <option value="">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Tripulación
          <select
            className={selectClass}
            value={query.crewId ?? ''}
            onChange={(e) => change({ crewId: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {query.crewId && !crews.some((c) => c.id === query.crewId) && (
              <option value={query.crewId}>{query.crewId}</option>
            )}
            {crews.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Fruta del diablo
          <select
            className={selectClass}
            value={query.fruit ?? ''}
            onChange={(e) => change({ fruit: (FRUITS.find((f) => f === e.target.value) as FruitType | undefined) })}
          >
            <option value="">Todas</option>
            {FRUITS.map((f) => (
              <option key={f} value={f}>
                {FRUIT_LABEL[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Ordenar por
          <select
            className={selectClass}
            value={query.sort}
            onChange={(e) => change({ sort: e.target.value as Sort })}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Por página
          <select
            className={selectClass}
            value={query.size}
            onChange={(e) => change({ size: Number(e.target.value) as Size })}
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            committedQ.current = ''
            setQInput('')
            change({ status: undefined, crewId: undefined, fruit: undefined, q: '' })
          }}
          className="self-end rounded border border-white/30 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
        >
          Limpiar filtros
        </button>
      </div>

      <p className="min-h-5 text-sm opacity-80" aria-live="polite">
        {data ? `${nf.format(data.totalElements)} carteles` : ''}
      </p>

      <div
        className="min-h-[520px]"
        aria-busy={loading}
        style={{ opacity: loading && data ? 0.6 : 1, transition: 'opacity 0.15s' }}
      >
        {list.status === 'error' && list.error ? (
          <div role="alert" className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
            <p>{list.error.message}</p>
            <button type="button" onClick={retry} className="rounded bg-amber-400 px-4 py-2 font-medium text-slate-900">
              Reintentar
            </button>
          </div>
        ) : !data ? (
          <ul aria-label="Cargando carteles" className="flex flex-col gap-2">
            {Array.from({ length: Math.min(query.size, 8) }, (_, i) => (
              <li key={i} className={`${ROW_MIN_HEIGHT} animate-pulse rounded-lg bg-white/10`} />
            ))}
          </ul>
        ) : data.content.length === 0 && data.totalPages === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
            <p>{hasFilters ? 'Ningún cartel coincide con esos filtros.' : 'Aún no hay carteles.'}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.content.map((w) => (
              <WantedRow key={w.id} wanted={w} onOpen={rememberScroll} />
            ))}
          </ul>
        )}
      </div>

      {totalPages > 0 && data && (
        <nav aria-label="Paginación" className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={loading || query.page <= 0}
            onClick={() => commit({ ...query, page: query.page - 1 })}
            className="rounded border border-white/30 px-4 py-2 hover:bg-white/10 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {Math.min(data.page, totalPages - 1) + 1} de {totalPages}
          </span>
          <button
            type="button"
            disabled={loading || query.page >= totalPages - 1}
            onClick={() => commit({ ...query, page: query.page + 1 })}
            className="rounded border border-white/30 px-4 py-2 hover:bg-white/10 disabled:opacity-40"
          >
            Siguiente
          </button>
        </nav>
      )}
    </main>
  )
}

function WantedRow({ wanted: w, onOpen }: { wanted: WantedSummary; onOpen: () => void }) {
  return (
    <li>
      <Link
        to={`/wanted/${w.id}`}
        onClick={onOpen}
        className={`${ROW_MIN_HEIGHT} flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 p-3 hover:bg-white/10`}
      >
        <div>
          <p className="font-semibold">
            {w.name} <span className="font-normal opacity-70">“{w.epithet}”</span>
          </p>
          <p className="text-sm opacity-75">
            {w.crew.name} · {STATUS_LABEL[w.status]}
            {w.devilFruit ? ` · ${FRUIT_LABEL[w.devilFruit.type]}` : ''} · Amenaza {w.threatLevel}/5
          </p>
        </div>
        <p className="text-lg font-semibold text-amber-300">{nf.format(w.bounty)} ฿</p>
      </Link>
    </li>
  )
}
