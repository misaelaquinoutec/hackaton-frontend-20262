export type NewsType = 'BOUNTY_UPDATE' | 'BATTLE' | 'MARINE_OPERATION' | 'WORLD_GOVERNMENT' | 'DISCOVERY'
export type NewsPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type NewsStatus = 'RUMOR' | 'CONFIRMED' | 'DEBUNKED'

export interface NewsItem {
  id: string
  type: NewsType
  priority: NewsPriority
  status: NewsStatus
  title: string
  summary: string
  source: string
  island: string
  relatedWanted: { id: string; name: string } | null
  publishedAt: string
  updatedAt: string
  verifiedAt: string | null
}

export type NewsDetail = NewsItem & { body: string[] }

export interface NewsFeedPage {
  items: NewsItem[]
  nextCursor: string | null
  hasMore: boolean
}
