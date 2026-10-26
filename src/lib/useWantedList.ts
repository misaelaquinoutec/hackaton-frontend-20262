import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch } from './api'
import { parseQuery, toApiParams } from './wantedParams'
import type { WantedPage } from '../types/wanted'

interface ListState {
  status: 'loading' | 'success' | 'error'
  // Se conserva la última página buena mientras carga la siguiente: el layout no salta.
  data: WantedPage | null
  error: ApiError | null
}

// `key` es la query canónica (URL). Cada cambio aborta la request anterior,
// así una respuesta vieja que llega tarde nunca reemplaza a la última pedida.
export function useWantedList(key: string): [ListState, () => void] {
  const [state, setState] = useState<ListState>({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ status: 'loading', data: s.data, error: null }))
    const params = toApiParams(parseQuery(new URLSearchParams(key)))
    apiFetch<WantedPage>(`/wanted?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, error: null })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const error =
          err instanceof ApiError
            ? err
            : new ApiError({ status: 0, code: 'UNKNOWN', message: 'Ocurrió un error inesperado.' })
        setState({ status: 'error', data: null, error })
      })
    return () => controller.abort()
  }, [key, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return [state, retry]
}
