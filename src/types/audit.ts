import type {
  ActionReasonCode,
  PortalAction,
} from '../domain/validation/validateAction'

export type AuditEventStatus = 'success' | 'rejected'

export interface AuditEvent {
  id: string
  timestamp: string

  portalId: string
  portalName: string

  action: PortalAction
  status: AuditEventStatus

  beforeRisk: number
  afterRisk: number

  reasonCode?: ActionReasonCode
  creatureCount?: number
}
