import type { Portal } from '../../types/portal'
import type { PortalAction } from '../validation/validateAction'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function applyAction(
  portal: Portal,
  action: PortalAction,
): Portal {
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