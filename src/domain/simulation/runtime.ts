import type { Portal } from '../../types/portal'
import type { AuditEvent, SystemAction } from '../../types/audit'
import { driftStability } from './drift'
import { initialPortals } from '../../data/portals'
import {
  effectiveRisk,
  isLive,
  isInactive,
  labResonance,
  QUARANTINE_RATE,
} from './network'
import { calculateRisk } from '../risk/calculateRisk'

export type GamePhase = 'RUNNING' | 'PAUSED' | 'GAME_OVER' | 'SHIFT_COMPLETE'
export interface GameState {
  portals: Portal[]
  events: AuditEvent[]
  phase: GamePhase
  elapsedMs: number
  finalResonance: number
}
export const COLLAPSE_MS = 1500
export function restartShift(): GameState {
  return {
    portals: initialPortals.map((p) => ({ ...p })),
    events: [],
    phase: 'RUNNING',
    elapsedMs: 0,
    finalResonance: 0,
  }
}
export function systemEvent(
  action: SystemAction,
  portal: Portal | undefined,
  now: number,
  score = 0,
  resonance = 0,
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(now).toISOString(),
    portalId: portal?.id ?? 'laboratory',
    portalName: portal?.name ?? 'RIFT // WARDEN',
    category: 'system',
    action,
    status: 'success',
    beforeRisk: score,
    afterRisk: action === 'portal-collapsed' ? 0 : score,
    resonance,
  }
}
// Securing can include emergency closures; the result reports actual research and losses,
// never claims forced/unknown closures were fully researched.
export function outcome(portals: Portal[]): GamePhase {
  if (!portals.length) return 'RUNNING'
  const collapsed = portals.filter((p) => p.status === 'collapsed').length
  if (collapsed >= 3 || collapsed === portals.length) return 'GAME_OVER'
  if (
    portals.every(
      (p) =>
        isInactive(p) ||
        (p.status === 'open' &&
          p.intel === 100 &&
          !p.uncertain &&
          effectiveRisk(p, portals).score < 25),
    )
  )
    return 'SHIFT_COMPLETE'
  return 'RUNNING'
}
export function finishShift(state: GameState, now = Date.now()): GameState {
  if (
    state.phase === 'GAME_OVER' ||
    state.phase === 'SHIFT_COMPLETE' ||
    !state.portals.length
  )
    return state
  if (outcome(state.portals) === 'GAME_OVER') {
    return {
      ...state,
      phase: 'GAME_OVER',
      events: [
        ...state.events,
        systemEvent('lab-lost', undefined, now, 0, state.finalResonance),
      ],
    }
  }
  if (outcome(state.portals) === 'SHIFT_COMPLETE') {
    return {
      ...state,
      phase: 'SHIFT_COMPLETE',
      finalResonance: labResonance(state.portals).score,
      events: [
        ...state.events,
        systemEvent(
          'shift-complete',
          undefined,
          now,
          0,
          labResonance(state.portals).score,
        ),
      ],
    }
  }
  return state
}
export function advanceSimulation(
  state: GameState,
  deltaMs: number,
  now = Date.now(),
  timeScale = 1,
): GameState {
  if (state.phase !== 'RUNNING' || !Number.isFinite(deltaMs) || deltaMs <= 0) return state
  let next: GameState = {
    ...state,
    portals: state.portals.map((p) => ({ ...p })),
    events: [...state.events],
  }
  let remaining = deltaMs * timeScale
  // Advance between domain deadlines, not animation frames. Large steps and small
  // steps encounter the same ordered collapse/shock boundaries.
  while (remaining > 0 && next.phase === 'RUNNING') {
    const deadlines = next.portals.flatMap((p) =>
      p.status === 'collapsing'
        ? [p.collapseTransitionMs]
        : isLive(p)
          ? [
              (p.collapseMinutes * 60000) /
                (p.status === 'quarantined' ? QUARANTINE_RATE : 1),
            ]
          : [],
    )
    const step = Math.max(0, Math.min(remaining, ...deadlines))
    next.elapsedMs += step
    remaining -= step
    next.portals = next.portals.map((p) => ({
      ...p,
      cooldownMs: Math.max(0, p.cooldownMs - step),
      stability: driftStability(p, step),
      collapseMinutes: isLive(p)
        ? Math.max(
            0,
            p.collapseMinutes -
              (step / 60000) * (p.status === 'quarantined' ? QUARANTINE_RATE : 1),
          )
        : p.collapseMinutes,
      collapseTransitionMs:
        p.status === 'collapsing'
          ? Math.max(0, p.collapseTransitionMs - step)
          : p.collapseTransitionMs,
    }))
    let transitioned = false
    const ids = [...next.portals]
      .sort((a, b) => b.difficulty - a.difficulty || a.id.localeCompare(b.id))
      .map((p) => p.id)
    for (const id of ids) {
      const p = next.portals.find((p) => p.id === id)!
      if (isLive(p) && p.collapseMinutes <= 1e-9) {
        p.collapseMinutes = 0
        p.status = 'collapsing'
        p.collapseTransitionMs = COLLAPSE_MS
        transitioned = true
        next.events.push(
          systemEvent(
            'collapse-started',
            p,
            now,
            effectiveRisk(p, next.portals).score,
            labResonance(next.portals).score,
          ),
        )
      } else if (p.status === 'collapsing' && p.collapseTransitionMs <= 0) {
        const resonance = labResonance(next.portals).score
        const before = effectiveRisk(p, next.portals).score
        p.status = 'collapsed'
        p.energy = 0
        p.stability = 0
        p.cooldownMs = 0
        transitioned = true
        next.finalResonance = resonance
        next.events.push(systemEvent('portal-collapsed', p, now, before, resonance))
        next.events.push(systemEvent('resonance-shock', p, now, 0, resonance))
        for (const target of next.portals.filter(isLive)) {
          const suppression = target.status === 'quarantined' ? 0.25 : 1
          const vulnerable = calculateRisk(target).score >= 50
          target.energy = Math.min(
            100,
            target.energy +
              Math.round(
                (6 + Math.floor(resonance / 10) + target.difficulty) * suppression,
              ),
          )
          target.stability = Math.max(
            0,
            target.stability - Math.round((4 + resonance / 12) * suppression),
          )
          const seconds =
            (vulnerable ? ((30 + resonance * 4) * target.difficulty) / 3 : 10) *
            suppression
          target.collapseMinutes = Math.max(0, target.collapseMinutes - seconds / 60)
          if (target.collapseMinutes <= 1e-9) {
            target.collapseMinutes = 0
            target.status = 'collapsing'
            target.collapseTransitionMs = COLLAPSE_MS
            next.events.push(
              systemEvent(
                'cascade',
                target,
                now,
                effectiveRisk(target, next.portals).score,
                resonance,
              ),
            )
          }
        }
      }
    }
    next = finishShift(next, now)
    if (step === 0 && !transitioned) break
  }
  return next
}
// A monotonic clock starts fresh after a pause/visibility change/reload.
// No persisted wall-clock deadline or offline catch-up.
export class SimulationClock {
  private last: number | null = null
  reset(now: number) {
    this.last = now
  }
  sample(now: number, phase: GamePhase): number {
    const elapsed = this.last === null ? 0 : Math.max(0, now - this.last)
    this.last = now
    return phase === 'RUNNING' ? elapsed : 0
  }
}
