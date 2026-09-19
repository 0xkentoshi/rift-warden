import type { Portal, RiskAssessment } from '../../types/portal'
import { calculateRisk, getRiskLevel } from '../risk/calculateRisk'

export const PRESSURE_CAP = 25
export const QUARANTINE_RATE = 0.25
export const isLive = (p: Portal) => p.status === 'open' || p.status === 'quarantined'
export const isInactive = (p: Portal) => p.status === 'closed' || p.status === 'collapsed'

// Read intrinsic risk only: effective assessments never feed back into this sum.
export function contribution(p: Portal): number {
  if (isInactive(p)) return 0
  const weights = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 12 }
  const raw = weights[calculateRisk(p).level] * (1 + (p.difficulty - 1) * 0.08)
  return raw * (p.status === 'quarantined' ? 0.15 : 1)
}
export const containmentDamage = (portals: Portal[]) =>
  portals.reduce((sum, p) => sum + (p.riftScar ?? 0), 0)
export function labResonance(portals: Portal[]) {
  const contributors = portals
    .map((p) => ({ id: p.id, name: p.name, value: contribution(p) }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))
  const score = Math.min(
    100,
    Math.round(contributors.reduce((s, p) => s + p.value, 0) * 1.2) +
      containmentDamage(portals),
  )
  const level =
    score >= 70
      ? 'CRITICAL'
      : score >= 45
        ? 'DANGEROUS'
        : score >= 25
          ? 'ELEVATED'
          : 'STABLE'
  return { score, level, contributors }
}
export function effectiveRisk(
  portal: Portal,
  network: Portal[] = [portal],
): RiskAssessment & { intrinsic: number; pressure: number } {
  const intrinsic = calculateRisk(portal)
  const pressure = isInactive(portal)
    ? 0
    : Math.min(
        PRESSURE_CAP,
        Math.round(
          network
            .filter((p) => p.id !== portal.id)
            .reduce((s, p) => s + contribution(p), 0) * 0.5,
        ),
      )
  const score = Math.min(100, intrinsic.score + pressure)
  return {
    ...intrinsic,
    intrinsic: intrinsic.score,
    pressure,
    score,
    level: getRiskLevel(score),
  }
}
