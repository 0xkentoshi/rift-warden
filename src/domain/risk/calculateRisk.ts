import type { Portal, RiskAssessment, RiskFactor, RiskLevel } from '../../types/portal'

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MEDIUM'

  return 'LOW'
}

export function calculateRisk(portal: Portal): RiskAssessment {
  if (portal.status === 'closed') {
    return {
      score: 0,
      level: 'LOW',
      factors: [],
    }
  }

  const factors: RiskFactor[] = []

  if (portal.stability <= 20) {
    factors.push({
      code: 'criticallyLowStability',
      points: 35,
    })
  } else if (portal.stability <= 40) {
    factors.push({
      code: 'lowStability',
      points: 25,
    })
  } else if (portal.stability <= 60) {
    factors.push({
      code: 'reducedStability',
      points: 10,
    })
  }

  if (portal.energy >= 90) {
    factors.push({
      code: 'extremeEnergy',
      points: 25,
    })
  } else if (portal.energy >= 75) {
    factors.push({
      code: 'highEnergy',
      points: 15,
    })
  } else if (portal.energy >= 60) {
    factors.push({
      code: 'elevatedEnergy',
      points: 5,
    })
  }

  if (portal.collapseMinutes <= 5) {
    factors.push({
      code: 'collapseImminent',
      points: 25,
    })
  } else if (portal.collapseMinutes <= 15) {
    factors.push({
      code: 'collapseApproaching',
      points: 15,
    })
  } else if (portal.collapseMinutes <= 30) {
    factors.push({
      code: 'limitedCollapseWindow',
      points: 5,
    })
  }

  if (portal.creatures >= 6) {
    factors.push({
      code: 'multipleCreatures',
      points: 15,
    })
  } else if (portal.creatures > 0) {
    factors.push({
      code: 'creaturesDetected',
      points: 8,
    })
  }

  if (portal.uncertain) {
    factors.push({
      code: 'uncertainState',
      points: 10,
    })
  }

  const score = Math.min(
    100,
    factors.reduce((total, factor) => total + factor.points, 0),
  )

  return {
    score,
    level: getRiskLevel(score),
    factors,
  }
}
