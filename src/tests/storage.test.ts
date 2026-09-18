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
    expect(loadLabState()).toEqual({ portals: [], events: [] })
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
