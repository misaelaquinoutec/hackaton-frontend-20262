import type { NewsStatus } from '../types/news'

export const STATUS_STYLE: Record<NewsStatus, string> = {
  RUMOR: 'bg-amber-400/20 text-amber-200',
  CONFIRMED: 'bg-emerald-400/20 text-emerald-200',
  DEBUNKED: 'bg-rose-400/20 text-rose-200',
}
