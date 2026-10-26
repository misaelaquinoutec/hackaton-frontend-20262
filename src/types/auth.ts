export interface User {
  id: string
  name: string
  email: string
}

export interface Team {
  code: string
  name: string
}

export interface LoginResponse {
  token: string
  tokenType: 'Bearer'
  expiresAt: string
  user: User
  team: Team
}

export interface MeResponse {
  user: User
  team: Team
  expiresAt: string
}

export interface LogPose {
  status: 'LOCKED' | 'UNLOCKED'
  grandLineUnlocked: boolean
  unlockedAt: string | null
  message: string
}

export interface WantedSummary {
  id: string
  name: string
  epithet: string
  bounty: number
  status: 'AT_LARGE' | 'CAPTURED' | 'MISSING'
  crew: { id: string; name: string }
  role: string
  devilFruit: { name: string; type: string } | null
  threatLevel: number
  lastSeenIsland: string
  updatedAt: string
}

export interface DashboardSummary {
  team: Team
  wanted: {
    total: number
    totalBounty: number
    averageBounty: number
    byStatus: { AT_LARGE: number; CAPTURED: number; MISSING: number }
    byFruit: { PARAMECIA: number; ZOAN: number; LOGIA: number; NONE: number }
  }
  crews: {
    total: number
    mostWanted: {
      id: string
      name: string
      shipName: string
      jollyRogerColor: string
      memberCount: number
      totalBounty: number
    } | null
  }
  topBounties: WantedSummary[]
  generatedAt: string
}
