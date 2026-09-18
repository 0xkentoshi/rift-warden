import type { Portal } from '../../types/portal'
import { calculateRisk } from '../risk/calculateRisk'
export type Recommendation = 'closed' | 'stabilize' | 'observe' | 'monitor'
export function recommendAction(portal: Portal): Recommendation {
  if (portal.status === 'closed') return 'closed'
  const risk = calculateRisk(portal)
  if (risk.score >= 25 && portal.stability < 90) return 'stabilize'
  if (portal.uncertain || risk.score >= 25) return 'observe'
  return 'monitor'
}
export function priorityPortals(portals: Portal[]): Portal[] {
  return portals
    .filter((p) => p.status === 'open' && (calculateRisk(p).score >= 25 || p.uncertain))
    .sort(
      (a, b) =>
        calculateRisk(b).score - calculateRisk(a).score ||
        a.collapseMinutes - b.collapseMinutes,
    )
}
