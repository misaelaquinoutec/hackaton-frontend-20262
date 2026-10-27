import type { NewsPriority, NewsStatus, NewsType } from '../types/news'

export const NEWS_TYPES: readonly NewsType[] = [
  'BOUNTY_UPDATE',
  'BATTLE',
  'MARINE_OPERATION',
  'WORLD_GOVERNMENT',
  'DISCOVERY',
]
export const NEWS_PRIORITIES: readonly NewsPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
export const NEWS_STATUSES: readonly NewsStatus[] = ['RUMOR', 'CONFIRMED', 'DEBUNKED']
export const FEED_LIMIT = 20

export const TYPE_LABEL: Record<NewsType, string> = {
  BOUNTY_UPDATE: 'Recompensas',
  BATTLE: 'Batallas',
  MARINE_OPERATION: 'Operaciones de la Marina',
  WORLD_GOVERNMENT: 'Gobierno Mundial',
  DISCOVERY: 'Descubrimientos',
}
export const PRIORITY_LABEL: Record<NewsPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}
export const NEWS_STATUS_LABEL: Record<NewsStatus, string> = {
  RUMOR: 'Rumor',
  CONFIRMED: 'Confirmada',
  DEBUNKED: 'Desmentida',
}

export interface NewsFilters {
  type?: NewsType
  priority?: NewsPriority
  status?: NewsStatus
}

// Cualquier valor fuera de contrato se ignora: la URL nunca rompe el feed.
export function parseFilters(params: URLSearchParams): NewsFilters {
  return {
    type: NEWS_TYPES.find((t) => t === params.get('type')),
    priority: NEWS_PRIORITIES.find((p) => p === params.get('priority')),
    status: NEWS_STATUSES.find((s) => s === params.get('status')),
  }
}

export function toSearchParams(filters: NewsFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.type) p.set('type', filters.type)
  if (filters.priority) p.set('priority', filters.priority)
  if (filters.status) p.set('status', filters.status)
  return p
}

export function toApiParams(filters: NewsFilters, cursor: string | null): URLSearchParams {
  const p = toSearchParams(filters)
  p.set('limit', String(FEED_LIMIT))
  if (cursor) p.set('cursor', cursor)
  return p
}
