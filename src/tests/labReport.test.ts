import { describe, expect, it } from 'vitest'

import { initialPortals } from '../data/portals'
import { createAuditEvent } from '../domain/events/createAuditEvent'
import { calculateLabReport } from '../domain/report/calculateLabReport'
import { calculateRisk } from '../domain/risk/calculateRisk'

describe('laboratory report', () => {
  it('calculates current portal summary', () => {
    const report = calculateLabReport(
      initialPortals,
      [],
    )

    expect(report.total).toBe(6)
    expect(report.open).toBe(5)
    expect(report.closed).toBe(1)
    expect(report.critical).toBe(1)
    expect(report.attention).toBe(2)
  })

  it('handles an empty laboratory without NaN', () => {
    const report = calculateLabReport([], [])

    expect(report.total).toBe(0)
    expect(report.averageRisk).toBe(0)
  })

  it('counts successful and rejected actions', () => {
    const portal = initialPortals[0]
    const risk = calculateRisk(portal).score

    const events = [
      createAuditEvent(
        portal,
        'stabilize',
        risk,
        38,
        {
          id: 'one',
          timestamp: '2026-09-18T10:00:00.000Z',
        },
      ),
      createAuditEvent(
        portal,
        'observe',
        risk,
        risk,
        {
          id: 'two',
          timestamp: '2026-09-18T10:01:00.000Z',
          status: 'rejected',
          reasonCode: 'criticalObserver',
        },
      ),
    ]

    const report = calculateLabReport(
      initialPortals,
      events,
    )

    expect(report.eventCount).toBe(2)
    expect(report.rejectedCount).toBe(1)
    expect(report.actionCounts.stabilize).toBe(1)
    expect(report.actionCounts.observe).toBe(1)
  })
})
