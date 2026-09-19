import type { Portal } from '../../types/portal'
import { effectiveRisk, isLive } from '../simulation/network'
import { validateAction, type PortalAction } from '../validation/validateAction'
export type Recommendation = PortalAction | 'closed' | 'lost' | 'monitor'
export function recommendAction(
  portal: Portal,
  network: Portal[] = [portal],
): Recommendation {
  if (portal.status === 'closed') return 'closed'
  if (portal.status === 'collapsed' || portal.status === 'collapsing') return 'lost'
  const risk = effectiveRisk(portal, network)
  const ordered: PortalAction[] =
    portal.collapseMinutes <= 0
      ? ['close']
      : portal.status === 'quarantined'
        ? ['stabilize', 'reactivate', 'close']
        : portal.intel === 100 && portal.creatures === 0
          ? ['close']
          : risk.score >= 50 || portal.energy >= 60
            ? ['stabilize', 'quarantine', 'observe', 'close']
            : ['observe', 'stabilize', 'close']
  return (
    ordered.find((action) => validateAction(portal, action, network).allowed) ?? 'monitor'
  )
}
export function priorityPortals(portals: Portal[]): Portal[] {
  return portals
    .filter(
      (p) =>
        isLive(p) &&
        (effectiveRisk(p, portals).score >= 25 ||
          p.uncertain ||
          p.status === 'quarantined'),
    )
    .sort(
      (a, b) =>
        effectiveRisk(b, portals).score - effectiveRisk(a, portals).score ||
        a.collapseMinutes - b.collapseMinutes,
    )
}
