import { ApiError } from './api'

export interface FormFailure {
  fieldErrors: Record<string, string>
  formError: string | null
}

// Lleva los errores del servidor junto al campo que corresponde.
export function toFormFailure(err: unknown): FormFailure {
  if (!(err instanceof ApiError)) return { fieldErrors: {}, formError: 'Ocurrió un error inesperado.' }
  if (err.code === 'EMAIL_ALREADY_REGISTERED') return { fieldErrors: { email: err.message }, formError: null }
  if (err.code === 'TEAM_NAME_TAKEN') return { fieldErrors: { teamName: err.message }, formError: null }
  if (err.code === 'VALIDATION_ERROR' && err.details.length > 0) {
    const fieldErrors: Record<string, string> = {}
    for (const d of err.details) fieldErrors[d.field] ??= d.message
    return { fieldErrors, formError: null }
  }
  if (err.code === 'RATE_LIMITED' && err.retryAfterSeconds) {
    return { fieldErrors: {}, formError: `${err.message} Reintenta en ${err.retryAfterSeconds} s.` }
  }
  return { fieldErrors: {}, formError: err.message }
}
