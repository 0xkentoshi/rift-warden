import type { AuditEvent } from '../types/audit'
import type { Language } from '../i18n/translations'
import type { Portal } from '../types/portal'
const STATE_KEY = 'rift-warden-state-v2'
const LEGACY_PORTALS_KEY = 'rift-warden-portals'
const LANGUAGE_KEY = 'rift-warden-language'
export interface LoadedLabState {
  portals: Portal[]
  events: AuditEvent[]
}
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
    listeners.forEach((listener) => listener())
  }
}
export function getStorageIssue() {
  return storageIssue
}
export function dismissStorageIssue() {
  reportStorageIssue(null)
}
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
const number = (v: unknown, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max
function isPortal(v: unknown): v is Portal {
  return (
    object(v) &&
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    typeof v.destination === 'string' &&
    number(v.energy, 100) &&
    number(v.stability, 100) &&
    number(v.collapseMinutes) &&
    number(v.creatures) &&
    Number.isInteger(v.creatures) &&
    (v.status === 'open' || v.status === 'closed') &&
    typeof v.uncertain === 'boolean'
  )
}
const actions = ['stabilize', 'observe', 'mark-uncertain', 'close']
const reasons = [
  'alreadyClosed',
  'criticalObserver',
  'alreadyStable',
  'alreadyUncertain',
  'creaturesInside',
]
function isEvent(v: unknown): v is AuditEvent {
  return (
    object(v) &&
    typeof v.id === 'string' &&
    typeof v.portalId === 'string' &&
    typeof v.portalName === 'string' &&
    typeof v.timestamp === 'string' &&
    Number.isFinite(Date.parse(v.timestamp)) &&
    actions.includes(String(v.action)) &&
    (v.status === 'success' || v.status === 'rejected') &&
    number(v.beforeRisk, 100) &&
    number(v.afterRisk, 100) &&
    (v.reasonCode === undefined || reasons.includes(String(v.reasonCode))) &&
    (v.creatureCount === undefined || number(v.creatureCount))
  )
}
function validPortals(v: unknown): v is Portal[] {
  return (
    Array.isArray(v) && v.every(isPortal) && new Set(v.map((p) => p.id)).size === v.length
  )
}
export function loadLabState(): LoadedLabState | null {
  const raw = readPreference(STATE_KEY)
  const current = parse(raw)
  if (
    object(current) &&
    current.version === 2 &&
    validPortals(current.portals) &&
    Array.isArray(current.events) &&
    current.events.every(isEvent) &&
    new Set(current.events.map((e) => e.id)).size === current.events.length
  )
    return { portals: current.portals, events: current.events }
  if (raw) reportStorageIssue('invalid')
  const legacyRaw = readPreference(LEGACY_PORTALS_KEY)
  const legacy = parse(legacyRaw)
  if (validPortals(legacy)) return { portals: legacy, events: [] }
  if (legacyRaw) reportStorageIssue('invalid')
  return null
}
export function saveLabState(portals: Portal[], events: AuditEvent[]): void {
  writePreference(STATE_KEY, JSON.stringify({ version: 2, portals, events }))
  remove(LEGACY_PORTALS_KEY)
}
export function clearLabState(): void {
  remove(STATE_KEY)
  remove(LEGACY_PORTALS_KEY)
}
export function loadLanguage(): Language {
  return readPreference(LANGUAGE_KEY) === 'ru' ? 'ru' : 'en'
}
export function saveLanguage(language: Language): void {
  writePreference(LANGUAGE_KEY, language)
}
