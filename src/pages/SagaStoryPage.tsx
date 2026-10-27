import { useCallback, useEffect, useRef } from 'react'
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
  if (state.status === 'error') return <ErrorBlock error={state.error} onRetry={retry} notFound="No encontramos esta saga" />
  return <Story key={id} story={state.data} />
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

  const goTo = useCallback(
    (n: number) => {
      const target = Math.min(Math.max(n, 1), stages.length)
      fromScroll.current = null
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('stage', String(target))
          return next
        },
        { replace: true },
      )
      const el = sectionRefs.current[target - 1]
      el?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      el?.focus({ preventScroll: true })
    },
    [setParams, stages.length],
  )

  // Teclado: ←/→ (o K/J) cambian de etapa, Inicio/Fin saltan a los extremos.
  // No se captura nada dentro de campos de formulario ni con modificadores.
  const stageRef = useRef(stageNum)
  useEffect(() => {
    stageRef.current = stageNum
  }, [stageNum])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const t = e.target as HTMLElement
      if (t.closest('input, select, textarea, [contenteditable="true"]')) return
      const k = e.key
      if (k === 'ArrowRight' || k === 'j') goTo(stageRef.current + 1)
      else if (k === 'ArrowLeft' || k === 'k') goTo(stageRef.current - 1)
      else if (k === 'Home') goTo(1)
      else if (k === 'End') goTo(stages.length)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, stages.length])

  const progress = stages.length > 1 ? activeIndex / (stages.length - 1) : 1

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
      <div
        role="progressbar"
        aria-label="Progreso del recorrido"
        aria-valuemin={1}
        aria-valuemax={stages.length}
        aria-valuenow={stageNum}
        aria-valuetext={`Etapa ${stageNum} de ${stages.length}`}
        className="fixed inset-x-0 top-0 z-20 h-1.5"
        style={{ background: 'var(--surface)' }}
      >
        <div
          className="story-progress h-full origin-left"
          style={{ background: 'var(--primary)', transform: `scaleX(${progress})` }}
        />
      </div>
      <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        <Link to="/sagas" viewTransition className="text-sm underline" style={{ color: 'var(--accent)' }}>
          ← Todas las sagas
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ viewTransitionName: `saga-${saga.id}` }}>
          {saga.title}
        </h1>
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
          <nav aria-label="Etapas" className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(stageNum - 1)}
              disabled={stageNum <= 1}
              className="story-btn"
              aria-label="Etapa anterior"
            >
              ←
            </button>
            <ol className="flex flex-1 flex-wrap justify-center gap-1">
              {stages.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goTo(s.order)}
                    aria-label={`Ir a la etapa ${s.order}: ${s.title}`}
                    aria-current={i === activeIndex ? 'step' : undefined}
                    className="story-dot"
                  />
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => goTo(stageNum + 1)}
              disabled={stageNum >= stages.length}
              className="story-btn"
              aria-label="Etapa siguiente"
            >
              →
            </button>
          </nav>
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
              tabIndex={-1}
              aria-labelledby={`${s.slug}-title`}
              aria-current={i === activeIndex ? 'step' : undefined}
              className="stage-card flex min-h-[70vh] flex-col justify-center gap-3 py-10"
              style={{ opacity: i === activeIndex ? 1 : 0.55 }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                Etapa {s.order} · {s.island.name}
              </span>
              <h2 id={`${s.slug}-title`} className="text-2xl font-bold">
                {s.title}
              </h2>
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
