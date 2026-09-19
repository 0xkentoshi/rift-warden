// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import {
  dismissStorageIssue,
  getStorageIssue,
  loadLabState,
  saveLabState,
  loadLanguage,
  saveLanguage,
} from '../storage/labStorage'
import { initialPortals } from '../data/portals'
describe('browser persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    dismissStorageIssue()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('roundtrips state including an intentionally empty laboratory', () => {
    saveLabState(initialPortals, [])
    expect(loadLabState()?.portals).toEqual(initialPortals)
    saveLabState([], [])
    expect(loadLabState()).toMatchObject({ portals: [], events: [] })
    saveLanguage('ru')
    expect(loadLanguage()).toBe('ru')
  })
  it.each([
    '{broken',
    '{"version":2,"portals":[{}],"events":[]}',
    '{"version":2,"portals":[],"events":[{"action":"bad"}]}',
  ])('recovers from malformed data %s', (raw) => {
    localStorage.setItem('rift-warden-state-v2', raw)
    expect(loadLabState()).toBeNull()
    expect(getStorageIssue()).toBe('invalid')
  })
  it('rejects impossible numeric data and duplicate portal IDs', () => {
    localStorage.setItem(
      'rift-warden-state-v2',
      JSON.stringify({
        version: 2,
        portals: [{ ...initialPortals[0], energy: -2 }],
        events: [],
      }),
    )
    expect(loadLabState()).toBeNull()
    localStorage.setItem(
      'rift-warden-state-v2',
      JSON.stringify({
        version: 2,
        portals: [initialPortals[0], initialPortals[0]],
        events: [],
      }),
    )
    expect(loadLabState()).toBeNull()
  })
  it('keeps the app usable if storage is denied or full', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => saveLabState(initialPortals, [])).not.toThrow()
    expect(loadLabState()).toBeNull()
    expect(getStorageIssue()).toBe('unavailable')
  })
  it('migrates valid legacy portal data', () => {
    localStorage.setItem('rift-warden-portals', JSON.stringify(initialPortals))
    expect(loadLabState()?.portals).toEqual(initialPortals)
  })
})

describe('version 3 gameplay persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    dismissStorageIssue()
  })
  const write = (extra: object) =>
    localStorage.setItem(
      'rift-warden-state-v3',
      JSON.stringify({
        version: 3,
        portals: initialPortals,
        events: [],
        phase: 'RUNNING',
        elapsedMs: 1200,
        finalResonance: 0,
        ...extra,
      }),
    )
  it('roundtrips research, isolation cooldown and remaining transition time', () => {
    const portals = initialPortals.map((p) => ({ ...p }))
    portals[0] = {
      ...portals[0],
      status: 'quarantined',
      cooldownMs: 5200,
      intel: 43,
      observerCount: 2,
      collapseMinutes: 1.23,
    }
    portals[3] = {
      ...portals[3],
      status: 'collapsing',
      collapseMinutes: 0,
      collapseTransitionMs: 1100,
    }
    saveLabState(portals, [], { phase: 'PAUSED', elapsedMs: 4500, finalResonance: 37 })
    expect(loadLabState()).toEqual({
      portals,
      events: [],
      phase: 'RUNNING',
      elapsedMs: 4500,
      finalResonance: 37,
    })
  })
  it('migrates v2 without altering the original save', () => {
    const old = JSON.stringify({ version: 2, portals: initialPortals, events: [] })
    localStorage.setItem('rift-warden-state-v2', old)
    const state = loadLabState()!
    saveLabState(state.portals, state.events, state)
    expect(loadLabState()).toEqual(state)
    expect(localStorage.getItem('rift-warden-state-v2')).toBe(old)
  })
  it.each([
    { intel: 101 },
    { intel: -1 },
    { observerCount: 1.5 },
    { difficulty: 0 },
    { difficulty: 7 },
    { cooldownMs: 10001 },
    { collapseTransitionMs: 1 },
    { status: 'collapsing', collapseMinutes: 1 },
    { status: 'collapsed', collapseMinutes: 2 },
    { energy: 101 },
    { creatures: -1 },
    { status: 'nonsense' },
  ])('rejects invalid portal additions %j', (bad) => {
    write({ portals: [{ ...initialPortals[0], ...bad }] })
    expect(loadLabState()).toBeNull()
    expect(getStorageIssue()).toBe('invalid')
  })
  it.each([
    { phase: 'BROKEN' },
    { phase: 'GAME_OVER' },
    { phase: 'SHIFT_COMPLETE' },
    { elapsedMs: -1 },
    { finalResonance: 101 },
  ])('rejects invalid runtime %j', (bad) => {
    write(bad)
    expect(loadLabState()).toBeNull()
  })
  it('rejects invalid audit categories, timestamps, closure types and duplicate IDs', () => {
    const event = {
      id: 'a',
      portalId: 'red',
      portalName: 'Red',
      timestamp: '2026-09-19T12:00:00Z',
      action: 'stabilize',
      status: 'success',
      beforeRisk: 80,
      afterRisk: 40,
      category: 'user',
    }
    for (const bad of [
      { timestamp: 'bad' },
      { category: 'system' },
      { closure: 'safe' },
      { action: 'resonance-shock' },
      { beforeIntel: 101 },
    ]) {
      write({ events: [{ ...event, ...bad }] })
      expect(loadLabState()).toBeNull()
    }
    write({ events: [event, event] })
    expect(loadLabState()).toBeNull()
  })
})
