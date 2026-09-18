import type { Portal } from '../../types/portal'
import type { AuditEvent } from '../../types/audit'
import type {
  ActionReasonCode,
  PortalAction,
} from '../validation/validateAction'

interface CreateAuditEventOptions {
  status?: AuditEvent['status']
  reasonCode?: ActionReasonCode
  creatureCount?: number
  timestamp?: string
  id?: string
}

export function createAuditEvent(
  portal: Portal,
  action: PortalAction,
  beforeRisk: number,
  afterRisk: number,
  options: CreateAuditEventOptions = {},
): AuditEvent {
  const timestamp = options.timestamp ?? new Date().toISOString()

  return {
    id:
      options.id ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp,
    portalId: portal.id,
    portalName: portal.name,
    action,
    status: options.status ?? 'success',
    beforeRisk,
    afterRisk,
    reasonCode: options.reasonCode,
    creatureCount: options.creatureCount,
  }
}
