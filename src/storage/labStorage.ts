import type { AuditEvent } from '../types/audit'
import type { Language } from '../i18n/translations'
import type { Portal } from '../types/portal'
import { initialPortals } from '../data/portals'
import { outcome, type GameState } from '../domain/simulation/runtime'
import { PORTAL_ACTIONS } from '../domain/validation/validateAction'
const STATE_KEY = 'rift-warden-state-v3'
const V2_KEY = 'rift-warden-state-v2'
const LEGACY_PORTALS_KEY = 'rift-warden-portals'
const LANGUAGE_KEY = 'rift-warden-language'
export type LoadedLabState = GameState
let storageIssue: 'invalid' | 'unavailable' | null = null
const listeners = new Set<() => void>()
export function subscribeStorageIssue(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function reportStorageIssue(issue: typeof storageIssue) {
  if (issue !== storageIssue) {
    storageIssue = issue
    listeners.forEach((l) => l())
  }
}
export const getStorageIssue = () => storageIssue
export const dismissStorageIssue = () => reportStorageIssue(null)
export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    reportStorageIssue('unavailable')
    return null
  }
}
export function writePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    reportStorageIssue('unavailable')
  }
}
function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    reportStorageIssue('unavailable')
  }
}
function parse(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    reportStorageIssue('invalid')
    return null
  }
}
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object'
const number = (v: unknown, max = Infinity): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max
const integer = (v: unknown, max = Infinity) => number(v, max) && Number.isInteger(v)
function basePortal(v: unknown): v is Portal {
  return (
    object(v) &&
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    typeof v.destination === 'string' &&
    number(v.energy, 100) &&
    number(v.stability, 100) &&
    number(v.collapseMinutes) &&
    integer(v.creatures) &&
    typeof v.uncertain === 'boolean'
  )
}
function isPortal(v: unknown): v is Portal {
  if (!basePortal(v)) return false
  return (
    ['open', 'closed', 'quarantined', 'collapsing', 'collapsed'].includes(v.status) &&
    (v.riftScar === undefined || number(v.riftScar, 100)) &&
    (v.observerActive === undefined || typeof v.observerActive === 'boolean') &&
    number(v.intel, 100) &&
    integer(v.observerCount, 10000) &&
    integer(v.difficulty, 6) &&
    v.difficulty >= 1 &&
    number(v.cooldownMs, 10000) &&
    number(v.collapseTransitionMs, 1500) &&
    (v.status !== 'collapsing' ||
      (v.collapseMinutes === 0 && v.collapseTransitionMs > 0)) &&
    (v.status === 'collapsing' || v.collapseTransitionMs === 0) &&
    (!['closed', 'collapsed'].includes(v.status) ||
      (v.collapseMinutes === 0 && v.cooldownMs === 0))
  )
}
const systems = [
  'observer-returned',
  'collapse-started',
  'portal-collapsed',
  'resonance-shock',
  'cascade',
  'lab-lost',
  'shift-complete',
]
const reasons = [
  'alreadyClosed',
  'criticalObserver',
  'alreadyStable',
  'alreadyUncertain',
  'creaturesInside',
  'collapseExpired',
  'fullyResearched',
  'energyCapacity',
  'quarantined',
  'notQuarantined',
  'alreadyQuarantined',
  'cooldown',
  'unsafeClosure',
  'portalLost',
  'activeObserverClosure',
]
function isEvent(v: unknown): v is AuditEvent {
  return (
    object(v) &&
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.portalId === 'string' &&
    typeof v.portalName === 'string' &&
    typeof v.timestamp === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(v.timestamp) &&
    Number.isFinite(Date.parse(v.timestamp)) &&
    [...PORTAL_ACTIONS, ...systems].includes(String(v.action)) &&
    (v.status === 'success' || v.status === 'rejected') &&
    number(v.beforeRisk, 100) &&
    number(v.afterRisk, 100) &&
    (v.category === undefined || v.category === 'user' || v.category === 'system') &&
    (!systems.includes(String(v.action)) || v.category === 'system') &&
    (v.category !== 'system' || systems.includes(String(v.action))) &&
    (v.reasonCode === undefined || reasons.includes(String(v.reasonCode))) &&
    (v.creatureCount === undefined || integer(v.creatureCount)) &&
    (v.closure === undefined ||
      ((v.closure === 'safe' || v.closure === 'forced') &&
        v.action === 'close' &&
        v.status === 'success')) &&
    ['beforeIntel', 'afterIntel', 'beforeEnergy', 'afterEnergy', 'resonance'].every(
      (k) => v[k] === undefined || number(v[k], 100),
    )
  )
}
function arrayOf<T extends { id: string }>(
  v: unknown,
  guard: (x: unknown) => x is T,
): v is T[] {
  return (
    Array.isArray(v) && v.every(guard) && new Set(v.map((x) => x.id)).size === v.length
  )
}
function migrate(portals: Portal[], events: AuditEvent[]): GameState {
  return {
    portals: portals.map((p) => {
      const seed = initialPortals.find((s) => s.id === p.id)
      return {
        ...p,
        intel: seed?.intel ?? 0,
        observerCount: 0,
        difficulty: seed?.difficulty ?? 1,
        cooldownMs: 0,
        collapseTransitionMs: 0,
        ...(p.status === 'closed'
          ? { energy: 0, stability: 100, collapseMinutes: 0 }
          : {}),
      }
    }),
    events,
    phase: 'RUNNING',
    elapsedMs: 0,
    finalResonance: 0,
  }
}
export function loadLabState(): LoadedLabState | null {
  const raw = readPreference(STATE_KEY)
  if (raw) {
    const v = parse(raw)
    if (
      object(v) &&
      v.version === 3 &&
      arrayOf(v.portals, isPortal) &&
      arrayOf(v.events, isEvent) &&
      ['RUNNING', 'PAUSED', 'GAME_OVER', 'SHIFT_COMPLETE'].includes(String(v.phase)) &&
      number(v.elapsedMs) &&
      number(v.finalResonance, 100) &&
      (!['GAME_OVER', 'SHIFT_COMPLETE'].includes(String(v.phase)) ||
        outcome(v.portals) === v.phase)
    ) {
      // Paused UI is transient. Reload always begins with a fresh monotonic clock.
      return {
        portals: v.portals,
        events: v.events,
        phase: v.phase === 'PAUSED' ? 'RUNNING' : (v.phase as GameState['phase']),
        elapsedMs: v.elapsedMs,
        finalResonance: v.finalResonance,
      }
    }
    reportStorageIssue('invalid')
    return null
  }
  const oldRaw = readPreference(V2_KEY),
    old = parse(oldRaw)
  const oldPortal = (v: unknown): v is Portal =>
    basePortal(v) && (v.status === 'open' || v.status === 'closed')
  if (
    object(old) &&
    old.version === 2 &&
    arrayOf(old.portals, oldPortal) &&
    arrayOf(old.events, isEvent)
  )
    return migrate(old.portals, old.events)
  if (oldRaw) {
    reportStorageIssue('invalid')
    return null
  }
  const legacyRaw = readPreference(LEGACY_PORTALS_KEY),
    legacy = parse(legacyRaw)
  if (arrayOf(legacy, oldPortal)) return migrate(legacy, [])
  if (legacyRaw) reportStorageIssue('invalid')
  return null
}
export function saveLabState(
  portals: Portal[],
  events: AuditEvent[],
  runtime?: Pick<GameState, 'phase' | 'elapsedMs' | 'finalResonance'>,
): void {
  writePreference(
    STATE_KEY,
    JSON.stringify({
      version: 3,
      portals,
      events,
      phase: runtime?.phase === 'PAUSED' ? 'RUNNING' : (runtime?.phase ?? 'RUNNING'),
      elapsedMs: runtime?.elapsedMs ?? 0,
      finalResonance: runtime?.finalResonance ?? 0,
    }),
  )
}
export function clearLabState(): void {
  remove(STATE_KEY)
  remove(V2_KEY)
  remove(LEGACY_PORTALS_KEY)
}
export function loadLanguage(): Language {
  return readPreference(LANGUAGE_KEY) === 'ru' ? 'ru' : 'en'
}
export function saveLanguage(language: Language): void {
  writePreference(LANGUAGE_KEY, language)
}
