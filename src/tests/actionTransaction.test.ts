import { describe, expect, it } from 'vitest'
import { initialPortals } from '../data/portals'
import { applyAction, performAction } from '../domain/actions/applyAction'
import { calculateRisk } from '../domain/risk/calculateRisk'
import { recommendAction } from '../domain/report/recommendation'
import { validateAction, type PortalAction } from '../domain/validation/validateAction'

describe('action transaction boundary', () => {
  it('previews the exact result without mutation, then reuses it at commit', () => {
    const original = structuredClone(initialPortals[0])
    const preview = applyAction(original, 'stabilize')
    expect(original).toEqual(initialPortals[0])
    const result = performAction(original, 'stabilize')
    expect(result.kind).toBe('success')
    if ('event' in result) {
      expect(result.portal).toEqual(preview)
      expect(result.event.afterRisk).toBe(calculateRisk(preview).score)
    }
  })
  it('requires acknowledgement for occupants and records that acknowledgement with the actual count', () => {
    expect(performAction(initialPortals[0], 'close')).toEqual({ kind: 'confirmation' })
    const result = performAction(initialPortals[0], 'close', true)
    expect(result.kind).toBe('success')
    if ('event' in result)
      expect(result.event).toMatchObject({
        reasonCode: 'creaturesInside',
        creatureCount: 3,
        beforeRisk: 83,
        afterRisk: 0,
      })
  })
  it('revalidates all actions on closed and expired portals and never allows a bypass', () => {
    const expired = { ...initialPortals[0], collapseMinutes: 0 }
    expect(recommendAction(expired)).toBe('close')
    for (const action of [
      'stabilize',
      'observe',
      'mark-uncertain',
      'close',
    ] as PortalAction[]) {
      expect(performAction(initialPortals[5], action, true).kind).toBe('rejected')
      expect(applyAction(initialPortals[5], action)).toEqual(initialPortals[5])
      if (action !== 'close')
        expect(validateAction(expired, action)).toMatchObject({
          allowed: false,
          reasonCode: 'collapseExpired',
        })
    }
    expect(
      validateAction({ ...initialPortals[4], stability: 100 }, 'stabilize').allowed,
    ).toBe(false)
  })
})
