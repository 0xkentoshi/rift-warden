import { describe, expect, it } from 'vitest'

import { initialPortals } from '../data/portals'
import { createAuditEvent } from '../domain/events/createAuditEvent'

describe('audit events', () => {
  it('records before and after risk values', () => {
    const event = createAuditEvent(
      initialPortals[0],
      'stabilize',
      93,
      38,
      {
        id: 'fixed-id',
        timestamp: '2026-09-18T10:00:00.000Z',
      },
    )

    expect(event.portalName).toBe('Crimson Gate')
    expect(event.beforeRisk).toBe(93)
    expect(event.afterRisk).toBe(38)
    expect(event.status).toBe('success')
  })

  it('records a rejected action reason', () => {
    const event = createAuditEvent(
      initialPortals[0],
      'observe',
      93,
      93,
      {
        id: 'fixed-id',
        timestamp: '2026-09-18T10:00:00.000Z',
        status: 'rejected',
        reasonCode: 'criticalObserver',
      },
    )

    expect(event.status).toBe('rejected')
    expect(event.reasonCode).toBe('criticalObserver')
  })
})
