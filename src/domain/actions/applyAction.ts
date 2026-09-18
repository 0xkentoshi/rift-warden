import type { Portal } from '../../types/portal'
import { validateAction, type PortalAction } from '../validation/validateAction'
import { calculateRisk } from '../risk/calculateRisk'
import { createAuditEvent } from '../events/createAuditEvent'
import type { AuditEvent } from '../../types/audit'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function applyAction(portal: Portal, action: PortalAction): Portal {
  if (!validateAction(portal, action).allowed) return portal
  switch (action) {
    case 'stabilize':
      return {
        ...portal,
        stability: clamp(portal.stability + 30, 0, 100),
        energy: clamp(portal.energy - 15, 0, 100),
        collapseMinutes: portal.collapseMinutes + 15,
      }

    case 'mark-uncertain':
      return {
        ...portal,
        uncertain: true,
      }

    case 'close':
      return {
        ...portal,
        status: 'closed',
        energy: 0,
        stability: 100,
        collapseMinutes: 0,
      }

    case 'observe':
      return portal

    default:
      return portal
  }
}

export type ActionResult =
  | { kind: 'success' | 'rejected'; portal: Portal; event: AuditEvent }
  | { kind: 'confirmation' | 'busy' }

// One transaction boundary for UI, keyboard and any future control surface.
// Preview uses applyAction; commit revalidates and records only what really happened.
export function performAction(
  portal: Portal,
  action: PortalAction,
  confirmed = false,
): ActionResult {
  const validation = validateAction(portal, action)
  if (validation.allowed && validation.requiresConfirmation && !confirmed)
    return { kind: 'confirmation' }
  const beforeRisk = calculateRisk(portal).score
  const next = validation.allowed ? applyAction(portal, action) : portal
  const kind = validation.allowed ? 'success' : 'rejected'
  return {
    kind,
    portal: next,
    event: createAuditEvent(portal, action, beforeRisk, calculateRisk(next).score, {
      status: kind,
      reasonCode: validation.reasonCode,
      creatureCount: portal.creatures,
    }),
  }
}
