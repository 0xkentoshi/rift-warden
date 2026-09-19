import { effectiveRisk, isLive, labResonance } from '../simulation/network'
import { PORTAL_ACTIONS, type PortalAction } from '../validation/validateAction'
import type { AuditEvent } from '../../types/audit'
import type { Portal } from '../../types/portal'
export interface LabReport {
  total: number
  open: number
  closed: number
  critical: number
  attention: number
  averageRisk: number
  eventCount: number
  rejectedCount: number
  actionCounts: Record<PortalAction, number>
  resonance: number
  researched: number
  unresolved: number
  quarantined: number
  collapsed: number
  forced: number
  systemEvents: number
}
export function calculateLabReport(portals: Portal[], events: AuditEvent[]): LabReport {
  const actionCounts = Object.fromEntries(PORTAL_ACTIONS.map((a) => [a, 0])) as Record<
    PortalAction,
    number
  >
  for (const event of events)
    if (event.action in actionCounts) actionCounts[event.action as PortalAction]++
  const active = portals.filter(isLive),
    risks = active.map((p) => effectiveRisk(p, portals))
  return {
    total: portals.length,
    open: active.length,
    closed: portals.filter((p) => p.status === 'closed').length,
    critical: risks.filter((r) => r.level === 'CRITICAL').length,
    attention: risks.filter((r) => r.score >= 50).length,
    averageRisk: risks.length
      ? Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length)
      : 0,
    eventCount: events.filter((e) => e.category !== 'system').length,
    rejectedCount: events.filter((e) => e.status === 'rejected').length,
    actionCounts,
    resonance: labResonance(portals).score,
    researched: portals.filter((p) => p.intel === 100).length,
    unresolved: portals.filter(
      (p) =>
        p.status === 'collapsing' ||
        (isLive(p) &&
          (p.intel < 100 ||
            effectiveRisk(p, portals).score >= 25 ||
            p.status === 'quarantined' ||
            p.uncertain)),
    ).length,
    quarantined: portals.filter((p) => p.status === 'quarantined').length,
    collapsed: portals.filter((p) => p.status === 'collapsed').length,
    forced: events.filter((e) => e.closure === 'forced').length,
    systemEvents: events.filter((e) => e.category === 'system').length,
  }
}
