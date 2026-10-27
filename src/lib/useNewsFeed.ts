import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, apiFetch } from './api'
import { parseFilters, toApiParams } from './newsParams'
import type { NewsDetail, NewsFeedPage, NewsItem } from '../types/news'

interface Snapshot {
  items: NewsItem[]
  nextCursor: string | null
  hasMore: boolean
}

interface FeedState extends Snapshot {
  // Filtros (URL canónica) a los que pertenecen estos datos: nunca se muestran con otros.
  key: string
  loading: 'first' | 'more' | null
  error: ApiError | null
}

// Lo ya cargado por filtros sobrevive al detalle: al volver no se pide de nuevo.
const cache = new Map<string, Snapshot>()
const scrollByKey = new Map<string, number>()

export const getSavedScroll = (key: string): number => scrollByKey.get(key) ?? 0
export const saveScroll = (key: string, y: number): void => {
  scrollByKey.set(key, y)
}

// Refleja una noticia verificada en lo cacheado; si ya no cumple el filtro de estado, sale del feed.
export function applyVerification(updated: NewsDetail): void {
  const { body: _body, ...item } = updated
  for (const [key, snap] of cache) {
    const status = parseFilters(new URLSearchParams(key)).status
    snap.items = snap.items.flatMap((n) => {
      if (n.id !== item.id) return [n]
      return status && status !== item.status ? [] : [item]
    })
  }
}

const fromKey = (key: string): FeedState => {
  const snap = cache.get(key)
  return {
    key,
    items: snap?.items ?? [],
    nextCursor: snap?.nextCursor ?? null,
    hasMore: snap?.hasMore ?? true,
    loading: null,
    error: null,
  }
}

export function useNewsFeed(key: string) {
  const [state, setState] = useState<FeedState>(() => fromKey(key))
  const inFlight = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const latest = useRef(state)
  useEffect(() => {
    latest.current = state
  }, [state])

  const load = useCallback(
    (cursor: string | null) => {
      if (inFlight.current) return // una sola carga en vuelo
      inFlight.current = true
      const ctrl = new AbortController()
      controller.current = ctrl
      setState((s) => ({ ...s, loading: cursor ? 'more' : 'first', error: null }))
      const params = toApiParams(parseFilters(new URLSearchParams(key)), cursor)
      apiFetch<NewsFeedPage>(`/news/feed?${params.toString()}`, { signal: ctrl.signal })
        .then((page) => {
          if (ctrl.signal.aborted) return
          inFlight.current = false
          setState((s) => {
            const seen = new Set(s.items.map((n) => n.id))
            const fresh = page.items.filter((n) => !seen.has(n.id) && seen.add(n.id))
            return {
              ...s,
              items: [...s.items, ...fresh],
              nextCursor: page.nextCursor,
              hasMore: page.hasMore && page.nextCursor !== null,
              loading: null,
            }
          })
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted) return
          inFlight.current = false
          const error =
            err instanceof ApiError
              ? err
              : new ApiError({ status: 0, code: 'UNKNOWN', message: 'Ocurrió un error inesperado.' })
          // Las noticias ya cargadas se conservan; solo se marca el error.
          setState((s) => ({ ...s, loading: null, error }))
        })
    },
    [key],
  )

  // Cambiar filtros aborta la carga en vuelo y empieza de cero (o desde lo cacheado).
  useEffect(() => {
    if (latest.current.key !== key) {
      const next = fromKey(key)
      latest.current = next
      setState(next)
    }
    if (!cache.has(key)) load(null)
    return () => {
      controller.current?.abort()
      inFlight.current = false
    }
  }, [key, load])

  useEffect(() => {
    if (state.key !== key || state.loading === 'first') return
    if (state.items.length === 0 && state.error) return
    cache.set(key, { items: state.items, nextCursor: state.nextCursor, hasMore: state.hasMore })
  }, [state, key])

  const current = state.key === key ? state : fromKey(key)
  const loadMore = useCallback(() => {
    const s = latest.current
    if (s.key === key && s.hasMore && !s.error && s.loading === null && s.items.length > 0) load(s.nextCursor)
  }, [key, load])
  const retry = useCallback(() => {
    const s = latest.current
    load(s.items.length > 0 ? s.nextCursor : null)
  }, [load])

  // Sin nada que mostrar y sin error: la primera página está en camino.
  const firstLoading = current.items.length === 0 && !current.error && current.hasMore
  return { ...current, firstLoading, loadMore, retry }
}
