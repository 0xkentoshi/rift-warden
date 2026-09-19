import type { Portal } from '../../types/portal'
import { validateAction, type PortalAction } from '../validation/validateAction'
import { effectiveRisk } from '../simulation/network'
import { observerTradeoff } from '../simulation/observer'
import { createAuditEvent } from '../events/createAuditEvent'
import type { AuditEvent } from '../../types/audit'

export function closureKind(portal: Portal): 'safe' | 'forced' {
  return portal.intel === 100 && portal.creatures === 0 && !portal.observerActive
    ? 'safe'
    : 'forced'
}
export const closureDamage = (p: Portal) =>
  closureKind(p) === 'safe' ? 0 : p.observerActive ? 12 : 6
export function applyAction(
  portal: Portal,
  action: PortalAction,
  network: Portal[] = [portal],
): Portal {
  if (!validateAction(portal, action, network).allowed) return portal
  switch (action) {
    case 'stabilize':
      return {
        ...portal,
        stability: Math.min(100, portal.stability + 30),
        energy: Math.max(0, portal.energy - 15),
        collapseMinutes: portal.collapseMinutes + 15,
      }
    case 'mark-uncertain':
      return { ...portal, uncertain: true }
    case 'quarantine':
      return { ...portal, status: 'quarantined', cooldownMs: 10000 }
    case 'reactivate':
      return {
        ...portal,
        status: 'open',
        energy: portal.energy + 6 + portal.difficulty,
        cooldownMs: 10000,
      }
    case 'close':
      return {
        ...portal,
        status: 'closed',
        riftScar: (portal.riftScar ?? 0) + closureDamage(portal),
        observerActive: false,
        energy: 0,
        stability: 100,
        collapseMinutes: 0,
        cooldownMs: 0,
        collapseTransitionMs: 0,
      }
    case 'observe': {
      const cost = observerTradeoff(portal)
      return {
        ...portal,
        intel: Math.min(100, portal.intel + cost.intel),
        energy: portal.energy + cost.energy,
        observerCount: portal.observerCount + 1,
        uncertain: false,
      }
    }
  }
}
export type ActionResult =
  | {
      kind: 'success' | 'rejected'
      portal: Portal
      event: AuditEvent
      systemEvents: AuditEvent[]
    }
  | { kind: 'confirmation' | 'busy' }
export function performAction(
  portal: Portal,
  action: PortalAction,
  confirmed = false,
  network: Portal[] = [portal],
): ActionResult {
  const validation = validateAction(portal, action, network)
  if (validation.allowed && validation.requiresConfirmation && !confirmed)
    return { kind: 'confirmation' }
  const next = validation.allowed ? applyAction(portal, action, network) : portal
  const kind = validation.allowed ? 'success' : 'rejected'
  const event = createAuditEvent(
    portal,
    action,
    effectiveRisk(portal, network).score,
    effectiveRisk(
      next,
      network.map((p) => (p.id === portal.id ? next : p)),
    ).score,
    { status: kind, reasonCode: validation.reasonCode, creatureCount: portal.creatures },
  )
  const systemEvents: AuditEvent[] =
    kind === 'success' && action === 'observe'
      ? [
          {
            ...event,
            id: crypto.randomUUID(),
            category: 'system',
            action: 'observer-returned',
            reasonCode: undefined,
            beforeRisk: event.afterRisk,
            afterRisk: event.afterRisk,
            afterIntel: next.intel,
          },
        ]
      : []
  return {
    kind,
    portal: next,
    systemEvents,
    event: {
      ...event,
      category: 'user',
      closure: kind === 'success' && action === 'close' ? closureKind(portal) : undefined,
      beforeIntel: portal.intel,
      afterIntel: next.intel,
      beforeEnergy: portal.energy,
      afterEnergy: next.energy,
    },
  }
}
