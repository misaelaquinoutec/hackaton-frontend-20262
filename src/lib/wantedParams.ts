import type { FruitType, WantedStatus } from '../types/wanted'

export const SIZES = [10, 20, 50] as const
export const SORTS = ['bounty,desc', 'name,asc', 'updatedAt,desc'] as const
export const STATUSES: readonly WantedStatus[] = ['AT_LARGE', 'CAPTURED', 'MISSING']
export const FRUITS: readonly FruitType[] = ['PARAMECIA', 'ZOAN', 'LOGIA', 'NONE']

export type Size = (typeof SIZES)[number]
export type Sort = (typeof SORTS)[number]

export const DEFAULT_SIZE: Size = 20
export const DEFAULT_SORT: Sort = 'bounty,desc'

export const STATUS_LABEL: Record<WantedStatus, string> = {
  AT_LARGE: 'Prófugo',
  CAPTURED: 'Capturado',
  MISSING: 'Desaparecido',
}
export const FRUIT_LABEL: Record<FruitType, string> = {
  PARAMECIA: 'Paramecia',
  ZOAN: 'Zoan',
  LOGIA: 'Logia',
  NONE: 'Sin fruta',
}
export const SORT_LABEL: Record<Sort, string> = {
  'bounty,desc': 'Mayor recompensa',
  'name,asc': 'Nombre (A–Z)',
  'updatedAt,desc': 'Actualizados recientemente',
}

export interface WantedQuery {
  page: number
  size: Size
  sort: Sort
  q: string
  status?: WantedStatus
  crewId?: string
  fruit?: FruitType
}

// Cualquier valor fuera de contrato cae a su valor por defecto: la URL nunca rompe la vista.
export function parseQuery(params: URLSearchParams): WantedQuery {
  const pageRaw = params.get('page')
  const page = pageRaw !== null && /^\d{1,6}$/.test(pageRaw) ? Number(pageRaw) : 0
  const sizeRaw = Number(params.get('size'))
  const size = SIZES.find((s) => s === sizeRaw) ?? DEFAULT_SIZE
  const sort = SORTS.find((s) => s === params.get('sort')) ?? DEFAULT_SORT
  const status = STATUSES.find((s) => s === params.get('status'))
  const fruit = FRUITS.find((f) => f === params.get('fruit'))
  const crewId = params.get('crewId')?.trim().slice(0, 200) || undefined
  const q = (params.get('q') ?? '').trim().slice(0, 100)
  return { page, size, sort, q, status, crewId, fruit }
}

// Solo escribe en la URL lo que se aparta de los valores por defecto.
export function toSearchParams(query: WantedQuery): URLSearchParams {
  const p = new URLSearchParams()
  if (query.status) p.set('status', query.status)
  if (query.crewId) p.set('crewId', query.crewId)
  if (query.fruit) p.set('fruit', query.fruit)
  if (query.q) p.set('q', query.q)
  if (query.sort !== DEFAULT_SORT) p.set('sort', query.sort)
  if (query.size !== DEFAULT_SIZE) p.set('size', String(query.size))
  if (query.page > 0) p.set('page', String(query.page))
  return p
}

// Parámetros para la API: siempre explícitos.
export function toApiParams(query: WantedQuery): URLSearchParams {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('size', String(query.size))
  p.set('sort', query.sort)
  if (query.status) p.set('status', query.status)
  if (query.crewId) p.set('crewId', query.crewId)
  if (query.fruit) p.set('fruit', query.fruit)
  if (query.q) p.set('q', query.q)
  return p
}
