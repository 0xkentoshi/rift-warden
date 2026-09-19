import type { ActionReasonCode, PortalAction } from '../domain/validation/validateAction'

export type AuditEventStatus = 'success' | 'rejected'
export type SystemAction =
  | 'observer-returned'
  | 'collapse-started'
  | 'portal-collapsed'
  | 'resonance-shock'
  | 'cascade'
  | 'lab-lost'
  | 'shift-complete'
export type AuditAction = PortalAction | SystemAction

export interface AuditEvent {
  id: string
  timestamp: string

  portalId: string
  portalName: string

  action: AuditAction
  category?: 'user' | 'system'
  closure?: 'safe' | 'forced'
  beforeIntel?: number
  afterIntel?: number
  beforeEnergy?: number
  afterEnergy?: number
  resonance?: number
  status: AuditEventStatus

  beforeRisk: number
  afterRisk: number

  reasonCode?: ActionReasonCode
  creatureCount?: number
}
