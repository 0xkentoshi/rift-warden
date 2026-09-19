// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { initialPortals } from '../data/portals'
import {
  applyAction,
  closureKind,
  closureDamage,
  performAction,
} from '../domain/actions/applyAction'
import { restartShift, advanceSimulation } from '../domain/simulation/runtime'
import { labResonance, containmentDamage } from '../domain/simulation/network'
import { driftStability } from '../domain/simulation/drift'
import { observerTradeoff } from '../domain/simulation/observer'
import { validateAction } from '../domain/validation/validateAction'
import { PortalRegistry } from '../components/ui/PortalRegistry'
import { saveLabState, loadLabState } from '../storage/labStorage'
afterEach(() => {
  cleanup()
  localStorage.clear()
})
const green = initialPortals[1],
  red = initialPortals[0]
describe('microfix containment', () => {
  it('force closure leaves 6 permanent resonance, stabilization cannot remove it, safe close costs zero', () => {
    const closed = applyAction(red, 'close'),
      safe = applyAction(initialPortals[4], 'close')
    expect(closed.riftScar).toBe(6)
    expect(safe.riftScar).toBe(0)
    expect(labResonance([closed]).score).toBe(6)
    expect(applyAction(closed, 'stabilize').riftScar).toBe(6)
    saveLabState([closed], [])
    expect(containmentDamage(loadLabState()!.portals)).toBe(6)
    expect(containmentDamage(restartShift().portals)).toBe(0)
  })
  it('active observer prevents safe closure and requires explicit warning for doubled damage', () => {
    const active = { ...initialPortals[4], observerActive: true }
    expect(closureKind(active)).toBe('forced')
    expect(closureDamage(active)).toBe(12)
    expect(validateAction(active, 'close')).toMatchObject({
      allowed: true,
      requiresConfirmation: true,
      reasonCode: 'activeObserverClosure',
    })
    expect(performAction(active, 'close').kind).toBe('confirmation')
    const result = performAction(active, 'close', true)
    if (!('event' in result)) throw Error('expected transaction')
    expect(result.portal).toMatchObject({ riftScar: 12, observerActive: false })
  })
})
describe('microfix time and caution', () => {
  it('red decays faster, quarantine quarter speed, and stability stays clamped', () => {
    expect(driftStability({ ...green, stability: 50 }, 60000)).toBeCloseTo(49.9)
    expect(driftStability({ ...red, stability: 50 }, 60000)).toBeCloseTo(49.5)
    expect(
      driftStability({ ...red, status: 'quarantined', stability: 50 }, 60000),
    ).toBeCloseTo(49.875)
    expect(driftStability({ ...red, stability: 0.01 }, 60000)).toBe(0)
    expect(driftStability({ ...red, status: 'closed' }, 60000)).toBe(red.stability)
  })
  it('scale affects simulation countdown, cooldown and drift; pause ignores 5x', () => {
    const s = { ...restartShift(), portals: [{ ...green, cooldownMs: 10000 }] }
    const normal = advanceSimulation(s, 1000, 0, 1),
      fast = advanceSimulation(s, 1000, 0, 5)
    expect(green.collapseMinutes - fast.portals[0].collapseMinutes).toBeCloseTo(
      5 * (green.collapseMinutes - normal.portals[0].collapseMinutes),
    )
    expect(fast.portals[0].cooldownMs).toBe(5000)
    expect(green.stability - fast.portals[0].stability).toBeCloseTo(
      5 * (green.stability - normal.portals[0].stability),
    )
    const paused = { ...s, phase: 'PAUSED' as const }
    expect(advanceSimulation(paused, 60000, 0, 5)).toBe(paused)
  })
  it('caution preserves risk penalty, slows drift and rewards only a successful observation', () => {
    const p = { ...green, intel: 0, energy: 60 },
      caution = applyAction(p, 'mark-uncertain')
    const base = observerTradeoff(p),
      bonus = observerTradeoff(caution)
    expect(caution.uncertain).toBe(true)
    expect(bonus.intel).toBe(Math.floor(base.intel * 1.25))
    expect(bonus.energy).toBe(Math.round(base.energy * 0.8))
    expect(p.stability - driftStability(caution, 60000)).toBeCloseTo(
      (p.stability - driftStability(p, 60000)) * 0.65,
    )
    const observed = applyAction(caution, 'observe')
    expect(observed.uncertain).toBe(false)
    expect(observed.intel).toBe(bonus.intel)
    expect(observed.energy).toBe(p.energy + bonus.energy)
    const critical = applyAction(red, 'mark-uncertain')
    expect(validateAction(critical, 'observe').reasonCode).toBe('criticalObserver')
    expect(applyAction(critical, 'observe').uncertain).toBe(true)
  })
  it('registry shows readings without portal action links', () => {
    render(<PortalRegistry portals={initialPortals} language="en" onClose={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('table').textContent).toContain('Intel')
    expect(
      screen.queryByRole('button', { name: /Crimson|Mossbound|STABILIZE|OBSERVE/ }),
    ).toBeNull()
  })
})
