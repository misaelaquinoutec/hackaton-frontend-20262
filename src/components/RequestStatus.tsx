import type { ApiError } from '../lib/api'

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center text-slate-300">
      {label}
    </div>
  )
}

export function ErrorBlock({
  error,
  onRetry,
  notFound = 'No encontramos este recurso',
}: {
  error: ApiError
  onRetry: () => void
  notFound?: string
}) {
  const locked = error.code === 'LOG_POSE_REQUIRED'
  const isNotFound = error.status === 404
  return (
    <div role="alert" className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold">
        {locked ? 'El Grand Line sigue cerrado' : isNotFound ? notFound : 'No se pudo cargar'}
      </h2>
      <p className="text-slate-300">
        {locked ? 'Necesitan el Log Pose: pidan la inspección en Reverse Mountain.' : error.message}
      </p>
      {!locked && !isNotFound && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded bg-amber-400 px-4 py-2 font-medium text-slate-900 hover:bg-amber-300"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
