import { describe, expect, it } from 'vitest'

import { applyAction } from '../domain/actions/applyAction'
import { calculateRisk } from '../domain/risk/calculateRisk'
import { validateAction } from '../domain/validation/validateAction'
import type { Portal } from '../types/portal'

const criticalPortal: Portal = {
  id: 'critical',
  name: 'Critical Portal',
  destination: 'Void',
  energy: 95,
  stability: 10,
  collapseMinutes: 3,
  creatures: 2,
  status: 'open',
  uncertain: false,
}

describe('portal actions', () => {
  it('blocks observer deployment for CRITICAL portal', () => {
    const result = validateAction(criticalPortal, 'observe')

    expect(result.allowed).toBe(false)
  })

  it('requires confirmation when creatures remain inside', () => {
    const result = validateAction(criticalPortal, 'close')

    expect(result.allowed).toBe(true)
    expect(result.requiresConfirmation).toBe(true)
  })

  it('blocks stabilization of a closed portal', () => {
    const result = validateAction(
      {
        ...criticalPortal,
        status: 'closed',
      },
      'stabilize',
    )

    expect(result.allowed).toBe(false)
  })

  it('reduces risk after stabilization', () => {
    const before = calculateRisk(criticalPortal)

    const stabilized = applyAction(criticalPortal, 'stabilize')
    const after = calculateRisk(stabilized)

    expect(after.score).toBeLessThan(before.score)
  })
})