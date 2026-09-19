export type PortalStatus = 'open' | 'quarantined' | 'collapsing' | 'collapsed' | 'closed'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type RiskFactorCode =
  | 'criticallyLowStability'
  | 'lowStability'
  | 'reducedStability'
  | 'extremeEnergy'
  | 'highEnergy'
  | 'elevatedEnergy'
  | 'collapseImminent'
  | 'collapseApproaching'
  | 'limitedCollapseWindow'
  | 'multipleCreatures'
  | 'creaturesDetected'
  | 'uncertainState'

export interface Portal {
  id: string
  name: string
  destination: string

  energy: number
  stability: number
  collapseMinutes: number

  creatures: number
  status: PortalStatus

  riftScar?: number
  observerActive?: boolean
  uncertain: boolean
  intel: number
  observerCount: number
  difficulty: number
  cooldownMs: number
  collapseTransitionMs: number
}

export interface RiskFactor {
  code: RiskFactorCode
  points: number
}

export interface RiskAssessment {
  score: number
  level: RiskLevel
  factors: RiskFactor[]
}
