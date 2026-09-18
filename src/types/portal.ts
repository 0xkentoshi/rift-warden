export type PortalStatus = 'open' | 'closed'

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

  uncertain: boolean
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
