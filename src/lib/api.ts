const BASE_URL = import.meta.env.VITE_API_BASE_URL as string
const TOKEN_KEY = 'logpose_token'

export interface ApiErrorBody {
  status: number
  code: string
  message: string
  traceId?: string
  retryAfterSeconds?: number
  details?: { field: string; message: string }[]
}

export class ApiError extends Error {
  status: number
  code: string
  retryAfterSeconds?: number
  details: { field: string; message: string }[]

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.status = body.status
    this.code = body.code
    this.retryAfterSeconds = body.retryAfterSeconds
    this.details = body.details ?? []
  }
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

// La app registra aquí qué hacer cuando una sesión activa deja de ser válida (401).
let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: (() => void) | null): void => {
  onUnauthorized = fn
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor.' })
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null
    const error = new ApiError({
      status: res.status,
      code: body?.code ?? 'INTERNAL_ERROR',
      message: body?.message ?? 'Error inesperado del servidor.',
      traceId: body?.traceId,
      retryAfterSeconds: body?.retryAfterSeconds,
      details: body?.details,
    })
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      clearToken()
      onUnauthorized?.()
    }
    throw error
  }
  return (await res.json()) as T
}
