import { calculateRisk } from '../risk/calculateRisk'
import type { PortalAction } from '../validation/validateAction'
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
}

export function calculateLabReport(
  portals: Portal[],
  events: AuditEvent[],
): LabReport {
  const actionCounts: Record<PortalAction, number> = {
    stabilize: 0,
    observe: 0,
    'mark-uncertain': 0,
    close: 0,
  }

  for (const event of events) {
    actionCounts[event.action] += 1
  }

  const openPortals = portals.filter(
    (portal) => portal.status === 'open',
  )

  const risks = openPortals.map((portal) =>
    calculateRisk(portal),
  )

  const critical = risks.filter(
    (risk) => risk.level === 'CRITICAL',
  ).length

  const attention = risks.filter(
    (risk) =>
      risk.level === 'HIGH' || risk.level === 'CRITICAL',
  ).length

  const averageRisk =
    risks.length === 0
      ? 0
      : Math.round(
          risks.reduce(
            (total, risk) => total + risk.score,
            0,
          ) / risks.length,
        )

  return {
    total: portals.length,
    open: openPortals.length,
    closed: portals.length - openPortals.length,
    critical,
    attention,
    averageRisk,

    eventCount: events.length,
    rejectedCount: events.filter(
      (event) => event.status === 'rejected',
    ).length,

    actionCounts,
  }
}
