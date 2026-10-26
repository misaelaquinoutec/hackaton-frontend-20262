import type { SagaStory, SagaSummary } from '../types/sagas'
import { apiFetch } from './api'

// Modo desarrollo: usa los ejemplos de Swagger mientras no hay Log Pose.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function getSagas(signal?: AbortSignal): Promise<SagaSummary[]> {
  if (USE_MOCK) {
    const { default: data } = await import('../mocks/sagas.json')
    return data as SagaSummary[]
  }
  return apiFetch<SagaSummary[]>('/sagas', { signal })
}

export async function getSagaStory(id: string, signal?: AbortSignal): Promise<SagaStory> {
  if (USE_MOCK) {
    const { default: data } = await import('../mocks/story.json')
    return data as SagaStory
  }
  return apiFetch<SagaStory>(`/sagas/${encodeURIComponent(id)}/story`, { signal })
}
