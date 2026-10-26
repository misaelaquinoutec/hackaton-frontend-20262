import type { SagaStage } from '../types/sagas'

interface Props {
  width: number
  height: number
  stages: SagaStage[]
  activeIndex: number
}

// Ruta unida en orden de etapas; se dibuja hasta la isla activa con stroke-dashoffset.
export function StoryMap({ width, height, stages, activeIndex }: Props) {
  const points = stages.map((s) => s.island)
  const lengths: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    lengths.push(lengths[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y))
  }
  const total = lengths[lengths.length - 1] || 1
  const drawn = (lengths[activeIndex] ?? 0) / total
  const current = points[activeIndex]
  const palette = stages[activeIndex]?.palette
  const route = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Mapa del Grand Line. Barco en ${current?.name ?? ''}, etapa ${activeIndex + 1} de ${stages.length}.`}
      className="h-full w-full rounded-lg"
      style={{ background: palette?.surface }}
    >
      <polyline
        points={route}
        fill="none"
        stroke={palette?.text}
        strokeOpacity={0.25}
        strokeWidth={2}
        strokeDasharray="6 6"
      />
      <polyline
        className="route-line"
        points={route}
        fill="none"
        stroke={palette?.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - drawn}
      />
      {points.map((p, i) => (
        <g key={stages[i]!.id}>
          <circle
            cx={p.x}
            cy={p.y}
            r={i === activeIndex ? 9 : 6}
            fill={i <= activeIndex ? palette?.primary : palette?.background}
            stroke={palette?.accent}
            strokeWidth={2}
          />
          <text
            x={p.x}
            y={p.y + 22}
            textAnchor="middle"
            fontSize={Math.max(width, height) / 45}
            fill={palette?.text}
            opacity={i === activeIndex ? 1 : 0.6}
          >
            {p.name}
          </text>
        </g>
      ))}
      {current && (
        <g className="ship" style={{ transform: `translate(${current.x}px, ${current.y}px)` }}>
          <g transform="translate(0,-24)" aria-hidden="true">
            <path d="M-12 8 L12 8 L8 16 L-8 16 Z" fill={palette?.accent} />
            <path d="M0 -14 L0 6 L11 6 Z" fill={palette?.text} />
            <path d="M0 -14 L0 4 L-9 4 Z" fill={palette?.text} fillOpacity={0.7} />
          </g>
        </g>
      )}
    </svg>
  )
}
