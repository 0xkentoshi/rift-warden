import type { Portal } from '../../types/portal'
import { effectiveRisk } from '../simulation/network'
import { observerTradeoff } from '../simulation/observer'

export const PORTAL_ACTIONS = [
  'stabilize',
  'observe',
  'mark-uncertain',
  'quarantine',
  'reactivate',
  'close',
] as const
export type PortalAction = (typeof PORTAL_ACTIONS)[number]
export type ActionReasonCode =
  | 'alreadyClosed'
  | 'criticalObserver'
  | 'alreadyStable'
  | 'alreadyUncertain'
  | 'creaturesInside'
  | 'collapseExpired'
  | 'fullyResearched'
  | 'energyCapacity'
  | 'quarantined'
  | 'notQuarantined'
  | 'alreadyQuarantined'
  | 'cooldown'
  | 'unsafeClosure'
  | 'portalLost'
export interface ActionValidation {
  allowed: boolean
  requiresConfirmation: boolean
  reasonCode?: ActionReasonCode
}
export function validateAction(
  portal: Portal,
  action: PortalAction,
  network: Portal[] = [portal],
): ActionValidation {
  const deny = (reasonCode: ActionReasonCode): ActionValidation => ({
    allowed: false,
    requiresConfirmation: false,
    reasonCode,
  })
  if (portal.status === 'closed') return deny('alreadyClosed')
  if (portal.status === 'collapsing' || portal.status === 'collapsed')
    return deny('portalLost')
  if (portal.collapseMinutes <= 0 && action !== 'close') return deny('collapseExpired')
  if (action === 'observe') {
    if (portal.status === 'quarantined') return deny('quarantined')
    if (effectiveRisk(portal, network).level === 'CRITICAL')
      return deny('criticalObserver')
    if (portal.intel >= 100) return deny('fullyResearched')
    if (portal.energy + observerTradeoff(portal).energy > 100)
      return deny('energyCapacity')
  }
  // High-stability rifts can still be vented when energy is dangerous.
  if (action === 'stabilize' && portal.stability >= 90 && portal.energy < 60)
    return deny('alreadyStable')
  if (action === 'mark-uncertain' && portal.uncertain) return deny('alreadyUncertain')
  if (action === 'quarantine' && portal.status === 'quarantined')
    return deny('alreadyQuarantined')
  if (action === 'reactivate' && portal.status !== 'quarantined')
    return deny('notQuarantined')
  if ((action === 'quarantine' || action === 'reactivate') && portal.cooldownMs > 0)
    return deny('cooldown')
  if (action === 'reactivate' && portal.energy + 6 + portal.difficulty > 100)
    return deny('energyCapacity')
  if (action === 'close' && portal.creatures > 0)
    return { allowed: true, requiresConfirmation: true, reasonCode: 'creaturesInside' }
  if (action === 'close' && portal.intel < 100)
    return { allowed: true, requiresConfirmation: true, reasonCode: 'unsafeClosure' }
  return { allowed: true, requiresConfirmation: false }
}
