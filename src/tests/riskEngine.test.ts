import { describe, expect, it } from 'vitest'

import { calculateRisk } from '../domain/risk/calculateRisk'
import type { Portal } from '../types/portal'

const safePortal: Portal = {
  id: 'safe',
  name: 'Safe Portal',
  destination: 'Garden',
  energy: 30,
  stability: 95,
  collapseMinutes: 120,
  creatures: 0,
  status: 'open',
  uncertain: false,
  intel: 0,
  observerCount: 0,
  difficulty: 1,
  cooldownMs: 0,
  collapseTransitionMs: 0,
}

describe('calculateRisk', () => {
  it('returns LOW risk for a stable portal', () => {
    const result = calculateRisk(safePortal)

    expect(result.score).toBe(0)
    expect(result.level).toBe('LOW')
  })

  it('returns CRITICAL risk for a dangerous portal', () => {
    const result = calculateRisk({
      ...safePortal,
      energy: 95,
      stability: 10,
      collapseMinutes: 3,
      creatures: 3,
    })

    expect(result.score).toBe(93)
    expect(result.level).toBe('CRITICAL')
  })

  it('returns zero risk for a closed portal', () => {
    const result = calculateRisk({
      ...safePortal,
      status: 'closed',
      energy: 100,
      stability: 0,
      collapseMinutes: 1,
    })

    expect(result.score).toBe(0)
    expect(result.level).toBe('LOW')
  })
})
