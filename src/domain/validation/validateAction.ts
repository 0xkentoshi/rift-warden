import { calculateRisk } from '../risk/calculateRisk'
import type { Portal } from '../../types/portal'

export type PortalAction =
  | 'stabilize'
  | 'observe'
  | 'mark-uncertain'
  | 'close'

export type ActionReasonCode =
  | 'alreadyClosed'
  | 'criticalObserver'
  | 'alreadyStable'
  | 'alreadyUncertain'
  | 'creaturesInside'

export interface ActionValidation {
  allowed: boolean
  requiresConfirmation: boolean
  reasonCode?: ActionReasonCode
}

export function validateAction(
  portal: Portal,
  action: PortalAction,
): ActionValidation {
  if (portal.status === 'closed') {
    return {
      allowed: false,
      requiresConfirmation: false,
      reasonCode: 'alreadyClosed',
    }
  }

  const risk = calculateRisk(portal)

  if (action === 'observe' && risk.level === 'CRITICAL') {
    return {
      allowed: false,
      requiresConfirmation: false,
      reasonCode: 'criticalObserver',
    }
  }

  if (action === 'stabilize' && portal.stability >= 90) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reasonCode: 'alreadyStable',
    }
  }

  if (action === 'mark-uncertain' && portal.uncertain) {
    return {
      allowed: false,
      requiresConfirmation: false,
      reasonCode: 'alreadyUncertain',
    }
  }

  if (action === 'close' && portal.creatures > 0) {
    return {
      allowed: true,
      requiresConfirmation: true,
      reasonCode: 'creaturesInside',
    }
  }

  return {
    allowed: true,
    requiresConfirmation: false,
  }
}
