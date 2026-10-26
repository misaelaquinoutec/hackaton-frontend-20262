import type { StageMetric } from '../types/sagas'

const nf = new Intl.NumberFormat('es-ES')

export function MetricsPanel({ metrics }: { metrics: StageMetric[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {metrics.map((m) => (
        <div key={m.key} className="rounded-lg p-2" style={{ background: 'var(--surface)' }}>
          <dt className="text-xs opacity-75">{m.label}</dt>
          <dd className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>
            {nf.format(m.value)} <span className="text-xs font-normal opacity-75">{m.unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
