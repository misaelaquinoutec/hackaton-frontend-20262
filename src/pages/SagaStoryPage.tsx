import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MetricsPanel } from '../components/MetricsPanel'
import { ErrorBlock, LoadingBlock } from '../components/RequestStatus'
import { StoryMap } from '../components/StoryMap'
import { getSagaStory } from '../lib/sagas'
import { useRequest } from '../lib/useRequest'
import type { SagaStory } from '../types/sagas'

// ?stage=N (1..stageCount). Cualquier valor inválido cae a la primera etapa.
function parseStage(raw: string | null, count: number): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= count ? n : 1
}

export default function SagaStoryPage() {
  const { id = '' } = useParams()
  const [state, retry] = useRequest((signal) => getSagaStory(id, signal), [id])

  if (state.status === 'loading') return <LoadingBlock label="Leyendo el Poneglyph…" />
  if (state.status === 'error') return <ErrorBlock error={state.error} onRetry={retry} />
  return <Story key={id} story={state.data} />
}

function Story({ story }: { story: SagaStory }) {
  const { saga, map, stages } = story
  const [params, setParams] = useSearchParams()
  const stageNum = parseStage(params.get('stage'), stages.length)
  const activeIndex = stageNum - 1
  const active = stages[activeIndex]!
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  // Última etapa fijada por el scroll: evita que la URL empuje el scroll de vuelta.
  const fromScroll = useRef<number | null>(null)

  // Scroll → URL
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const n = Number((e.target as HTMLElement).dataset.stage)
          fromScroll.current = n
          setParams(
            (prev) => {
              if (prev.get('stage') === String(n)) return prev
              const next = new URLSearchParams(prev)
              next.set('stage', String(n))
              return next
            },
            { replace: true },
          )
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    sectionRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [setParams, stages.length])

  // URL → scroll (apertura directa, atrás/adelante o URL editada)
  useEffect(() => {
    if (fromScroll.current === stageNum) return
    sectionRefs.current[activeIndex]?.scrollIntoView({ block: 'center' })
  }, [stageNum, activeIndex])

  const p = active.palette
  const vars = {
    '--bg': p.background,
    '--surface': p.surface,
    '--primary': p.primary,
    '--accent': p.accent,
    '--text': p.text,
  } as CSSProperties

  return (
    <div className="story-root min-h-screen" style={vars}>
      <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        <Link to="/sagas" className="text-sm underline" style={{ color: 'var(--accent)' }}>
          ← Todas las sagas
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{saga.title}</h1>
        <p className="italic opacity-80">{saga.subtitle}</p>
        <p className="mt-3 max-w-prose">{saga.intro}</p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <aside
          aria-label="Mapa y métricas de la etapa activa"
          className="sticky top-0 z-10 flex h-[42vh] flex-col gap-2 py-3 lg:h-screen lg:py-8"
          style={{ background: 'var(--bg)' }}
        >
          <div className="min-h-0 flex-1">
            <StoryMap width={map.width} height={map.height} stages={stages} activeIndex={activeIndex} />
          </div>
          <p className="text-sm opacity-80" aria-live="polite">
            Etapa {stageNum} de {stages.length} · {active.island.name}
          </p>
          <MetricsPanel metrics={active.metrics} />
        </aside>

        <div>
          {stages.map((s, i) => (
            <section
              key={s.id}
              id={s.slug}
              data-stage={s.order}
              ref={(el) => {
                sectionRefs.current[i] = el
              }}
              aria-current={i === activeIndex ? 'step' : undefined}
              className="flex min-h-[70vh] flex-col justify-center gap-3 py-10"
              style={{ opacity: i === activeIndex ? 1 : 0.55 }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                Etapa {s.order} · {s.island.name}
              </span>
              <h2 className="text-2xl font-bold">{s.title}</h2>
              {s.narrative.map((para, j) => (
                <p key={j} className="max-w-prose leading-relaxed">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
