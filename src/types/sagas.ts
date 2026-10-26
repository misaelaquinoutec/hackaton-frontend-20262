export interface Palette {
  background: string
  surface: string
  primary: string
  accent: string
  text: string
}

export interface SagaSummary {
  id: string
  order: number
  title: string
  subtitle: string
  synopsis: string
  stageCount: number
  totalDistanceNm: number
  firstIsland: string
  lastIsland: string
  palette: Palette
}

export type SagaInfo = SagaSummary & { intro: string }

export type MetricKey = 'distanceNm' | 'crewMorale' | 'bountyPool' | 'marineThreat'

export interface StageMetric {
  key: MetricKey
  label: string
  value: number
  unit: string
}

export interface Island {
  id: string
  name: string
  x: number
  y: number
}

export interface SagaStage {
  id: string
  order: number
  slug: string
  title: string
  narrative: string[]
  island: Island
  palette: Palette
  metrics: StageMetric[]
}

export interface SagaStory {
  saga: SagaInfo
  map: { width: number; height: number }
  stages: SagaStage[]
}
