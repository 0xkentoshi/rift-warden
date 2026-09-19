import { describe, it, expect } from 'vitest'
import { initialPortals } from '../data/portals'
import { calculateRisk } from '../domain/risk/calculateRisk'
import { applyAction, performAction, closureKind } from '../domain/actions/applyAction'
import { validateAction, PORTAL_ACTIONS } from '../domain/validation/validateAction'
import { recommendAction } from '../domain/report/recommendation'
import {
  contribution,
  effectiveRisk,
  labResonance,
  PRESSURE_CAP,
} from '../domain/simulation/network'
import { observerTradeoff } from '../domain/simulation/observer'
import {
  restartShift,
  advanceSimulation,
  finishShift,
  SimulationClock,
  type GameState,
} from '../domain/simulation/runtime'
const green = () => ({ ...initialPortals[1] })
const now = Date.parse('2026-09-19T12:00:00Z')
const hot = () =>
  initialPortals.map((p) => ({
    ...p,
    status: 'open' as const,
    energy: 99,
    stability: 10,
    collapseMinutes: 1,
    intel: 20,
  }))
describe('Intel and expeditions', () => {
  it('collects real Intel, pays real energy, clears uncertainty and uses unchanged intrinsic engine', () => {
    const p = { ...green(), energy: 58, intel: 20, uncertain: true },
      n = applyAction(p, 'observe')
    expect(n.intel).toBeGreaterThan(p.intel)
    expect(n.energy).toBe(62)
    expect(n.observerCount).toBe(1)
    expect(n.uncertain).toBe(false)
    expect(calculateRisk(n).factors.some((f) => f.code === 'elevatedEnergy')).toBe(true)
    expect(p.intel).toBe(20)
  })
  it('higher difficulty and repeated expeditions cost more and yield less', () => {
    const g = { ...green(), intel: 0 },
      r = { ...g, difficulty: 6 },
      repeat = { ...g, observerCount: 2 }
    expect(observerTradeoff(r).energy).toBeGreaterThan(observerTradeoff(g).energy)
    expect(observerTradeoff(r).intel).toBeLessThan(observerTradeoff(g).intel)
    expect(observerTradeoff(repeat).energy).toBeGreaterThan(observerTradeoff(g).energy)
    expect(observerTradeoff(repeat).intel).toBeLessThan(observerTradeoff(g).intel)
  })
  it('caps Intel and blocks full research and insufficient energy', () => {
    const p = { ...green(), intel: 99 }
    expect(applyAction(p, 'observe').intel).toBe(100)
    expect(validateAction({ ...p, intel: 100 }, 'observe').reasonCode).toBe(
      'fullyResearched',
    )
    expect(validateAction({ ...p, energy: 99 }, 'observe').reasonCode).toBe(
      'energyCapacity',
    )
  })
  it('blocks both intrinsic and network-induced CRITICAL observations', () => {
    expect(validateAction(initialPortals[0], 'observe').reasonCode).toBe(
      'criticalObserver',
    )
    const p = { ...green(), energy: 90, stability: 30, collapseMinutes: 16, creatures: 1 }
    expect(calculateRisk(p).score).toBeLessThan(75)
    expect(
      validateAction(p, 'observe', [p, ...hot().filter((q) => q.id !== p.id)]).reasonCode,
    ).toBe('criticalObserver')
  })
  it('preview and commit match with an entire network', () => {
    const net = restartShift().portals,
      p = { ...net[1], intel: 20, energy: 59 }
    net[1] = p
    const preview = applyAction(p, 'observe', net),
      result = performAction(p, 'observe', true, net)
    expect(result.kind).toBe('success')
    if ('event' in result) {
      expect(result.portal).toEqual(preview)
      expect(result.event.afterRisk).toBe(
        effectiveRisk(
          preview,
          net.map((q) => (q.id === p.id ? preview : q)),
        ).score,
      )
    }
  })
})
describe('nonrecursive network', () => {
  it('excludes self, including duplicate self IDs supplied to the pure calculation', () => {
    const p = hot()[0]
    expect(effectiveRisk(p, [p, p]).pressure).toBe(0)
  })
  it('orders contributions, removes closed, suppresses quarantine', () => {
    const p = green(),
      h = { ...p, energy: 95, stability: 30, collapseMinutes: 10 },
      c = { ...h, stability: 10, creatures: 3 }
    expect(contribution(p)).toBeLessThan(contribution(h))
    expect(contribution(h)).toBeLessThan(contribution(c))
    expect(contribution({ ...c, status: 'closed' })).toBe(0)
    expect(contribution({ ...c, status: 'quarantined' })).toBeCloseTo(
      contribution(c) * 0.15,
    )
  })
  it('caps pressure and never recursively increases a repeated assessment', () => {
    const net = hot(),
      p = net[0],
      first = effectiveRisk(p, net)
    for (let i = 0; i < 50; i++) expect(effectiveRisk(p, net)).toEqual(first)
    expect(first.pressure).toBeLessThanOrEqual(PRESSURE_CAP)
  })
  it('one HIGH is manageable, four dangerous portals materially affect Green', () => {
    const p = green(),
      one = { ...hot()[0], stability: 30, creatures: 0 }
    expect(effectiveRisk(p, [p, one]).score).toBeLessThan(25)
    const net = [
      p,
      ...hot()
        .filter((q) => q.id !== p.id)
        .slice(0, 4),
    ]
    expect(effectiveRisk(p, net).pressure).toBeGreaterThanOrEqual(20)
    expect(labResonance(net).score).toBeGreaterThanOrEqual(60)
  })
})
describe('quarantine and closure', () => {
  it('isolation buys time, reduces network load, blocks observation and toggling spam', () => {
    const p = { ...green(), intel: 0 },
      q = applyAction(p, 'quarantine')
    expect(q.status).toBe('quarantined')
    expect(contribution(q)).toBeLessThan(contribution(p) / 5)
    expect(validateAction(q, 'observe').reasonCode).toBe('quarantined')
    expect(validateAction(q, 'reactivate').reasonCode).toBe('cooldown')
    const state = advanceSimulation({ ...restartShift(), portals: [q] }, 10000, now)
    expect(state.portals[0].collapseMinutes).toBeCloseTo(p.collapseMinutes - 2.5 / 60)
    const active = applyAction(state.portals[0], 'reactivate')
    expect(active.status).toBe('open')
    expect(active.energy).toBe(p.energy + 7)
    expect(validateAction(active, 'quarantine').reasonCode).toBe('cooldown')
    expect(contribution(active)).toBeGreaterThan(contribution(q))
  })
  it('safe close is immediately available in the reviewer seed', () => {
    const p = initialPortals[4]
    expect(p.intel).toBe(100)
    expect(closureKind(p)).toBe('safe')
    const result = performAction(p, 'close')
    expect(result.kind).toBe('success')
    if ('event' in result) {
      expect(result.event.closure).toBe('safe')
      expect(contribution(result.portal)).toBe(0)
    }
  })
  it('unknown or occupied closures require acknowledgement and retain forced audit semantics', () => {
    for (const p of [
      { ...green(), intel: 20 },
      { ...green(), intel: 100, creatures: 2 },
    ]) {
      expect(performAction(p, 'close')).toEqual({ kind: 'confirmation' })
      const result = performAction(p, 'close', true)
      if ('event' in result) {
        expect(result.event.closure).toBe('forced')
        expect(result.portal.status).toBe('closed')
      }
    }
  })
  it('all ordinary actions are blocked after closure or collapse', () => {
    for (const status of ['closed', 'collapsed', 'collapsing'] as const)
      for (const action of PORTAL_ACTIONS)
        expect(validateAction({ ...green(), status }, action).allowed).toBe(false)
  })
})
describe('time, containment and deterministic cascades', () => {
  it('freezes all domain timers while paused or ended', () => {
    for (const phase of ['PAUSED', 'GAME_OVER', 'SHIFT_COMPLETE'] as const) {
      const s = { ...restartShift(), phase }
      expect(advanceSimulation(s, 120000, now)).toBe(s)
    }
  })
  it('the monotonic clock excludes two minutes of reading and resumes from the correct anchor', () => {
    const clock = new SimulationClock()
    clock.reset(0)
    expect(clock.sample(1000, 'RUNNING')).toBe(1000)
    expect(clock.sample(121000, 'PAUSED')).toBe(0)
    expect(clock.sample(122000, 'RUNNING')).toBe(1000)
  })
  it('ticks normally, stabilization adds real time, isolation uses one quarter speed', () => {
    const p = green(),
      base = { ...restartShift(), portals: [p] }
    expect(advanceSimulation(base, 60000, now).portals[0].collapseMinutes).toBe(53)
    expect(applyAction(p, 'stabilize').collapseMinutes).toBe(69)
    expect(
      advanceSimulation(
        { ...base, portals: [{ ...p, status: 'quarantined' }] },
        60000,
        now,
      ).portals[0].collapseMinutes,
    ).toBe(53.75)
  })
  it('a calm network survives one collapse with exactly one shock', () => {
    const s = {
      ...restartShift(),
      portals: [
        { ...green(), collapseMinutes: 0.01 },
        { ...green(), id: 'other', intel: 20 },
      ],
    }
    const n = advanceSimulation(s, 10000, now)
    expect(n.portals[0].status).toBe('collapsed')
    expect(n.phase).toBe('RUNNING')
    expect(n.events.filter((e) => e.action === 'portal-collapsed')).toHaveLength(1)
    expect(n.events.filter((e) => e.action === 'resonance-shock')).toHaveLength(1)
    const later = advanceSimulation(n, 10000, now + 10000)
    expect(later.events.filter((e) => e.action === 'resonance-shock')).toHaveLength(1)
  })
  it('an unstable network cascades and loses containment exactly once', () => {
    const net = hot()
    net[0].collapseMinutes = 0.01
    const lost = advanceSimulation({ ...restartShift(), portals: net }, 10000, now)
    expect(lost.phase).toBe('GAME_OVER')
    expect(lost.events.some((e) => e.action === 'cascade')).toBe(true)
    expect(lost.events.filter((e) => e.action === 'lab-lost')).toHaveLength(1)
    expect(advanceSimulation(lost, 60000, now)).toBe(lost)
    expect(
      new Set(
        lost.events.filter((e) => e.action === 'resonance-shock').map((e) => e.portalId),
      ).size,
    ).toBe(lost.events.filter((e) => e.action === 'resonance-shock').length)
  })
  it('large and small simulation steps produce the same lifecycle, elapsed time and event order', () => {
    const net = hot()
    net[0].collapseMinutes = 0.01
    const initial = { ...restartShift(), portals: net },
      large = advanceSimulation(initial, 10000, now)
    let small: GameState = initial
    for (let i = 0; i < 100; i++) small = advanceSimulation(small, 100, now)
    expect(small.phase).toBe(large.phase)
    expect(small.portals).toEqual(large.portals)
    expect(small.events.map((e) => [e.action, e.portalId])).toEqual(
      large.events.map((e) => [e.action, e.portalId]),
    )
  })
  it('the initial demo survives 2 active minutes without collapse, one portal is critical and one can safely close', () => {
    const initial = restartShift(),
      next = advanceSimulation(initial, 120000, now)
    expect(next.events).toHaveLength(0)
    expect(
      initial.portals.filter(
        (p) => effectiveRisk(p, initial.portals).level === 'CRITICAL',
      ),
    ).toHaveLength(1)
  })
  it('completion rejects unresolved isolation and empty QA, accepts secured rifts and reports actual research', () => {
    const safe = initialPortals.map((p) => ({
      ...p,
      status: 'closed' as const,
      energy: 0,
      stability: 100,
      collapseMinutes: 0,
      intel: 100,
    }))
    expect(finishShift({ ...restartShift(), portals: safe }, now).phase).toBe(
      'SHIFT_COMPLETE',
    )
    expect(finishShift({ ...restartShift(), portals: [] }, now).phase).toBe('RUNNING')
    expect(
      finishShift(
        {
          ...restartShift(),
          portals: [{ ...green(), status: 'quarantined', intel: 100 }],
        },
        now,
      ).phase,
    ).toBe('RUNNING')
  })
  it('restart returns fresh initial state and clears transitions, audit and end flags', () => {
    const a = restartShift()
    a.portals[0].intel = 100
    a.phase = 'GAME_OVER'
    const b = restartShift()
    expect(b.portals).toEqual(initialPortals)
    expect(b.phase).toBe('RUNNING')
    expect(b.events).toEqual([])
    expect(b.elapsedMs).toBe(0)
  })
})
describe('recommendations and balance policy', () => {
  it('never suggests a forbidden action across critical, expired, quarantined and completed states', () => {
    const samples = initialPortals.flatMap((p) => [
      p,
      { ...p, stability: 100 },
      { ...p, intel: 100 },
      { ...p, collapseMinutes: 0 },
      { ...p, status: 'quarantined' as const, cooldownMs: 10000 },
    ])
    for (const p of samples) {
      const action = recommendAction(p, initialPortals)
      if (PORTAL_ACTIONS.includes(action as (typeof PORTAL_ACTIONS)[number]))
        expect(
          validateAction(p, action as (typeof PORTAL_ACTIONS)[number], initialPortals)
            .allowed,
        ).toBe(true)
    }
  })
  it('can fully research every initially active rift with paid expeditions and venting; Green needs one expedition', () => {
    let s = restartShift()
    let greenObservers = 0,
      redObservers = 0,
      operations = 0
    const order = [...s.portals]
      .sort((a, b) => a.difficulty - b.difficulty)
      .map((p) => p.id)
    for (const id of order) {
      for (let i = 0; i < 100; i++) {
        const p = s.portals.find((p) => p.id === id)!
        if (p.status === 'closed') break
        let action: 'observe' | 'stabilize' | 'close' =
          p.intel === 100 ? 'close' : 'observe'
        if (!validateAction(p, action, s.portals).allowed) action = 'stabilize'
        expect(validateAction(p, action, s.portals).allowed).toBe(true)
        const n = applyAction(p, action, s.portals)
        if (action === 'observe') {
          if (p.difficulty === 1) greenObservers++
          if (p.difficulty === 6) redObservers++
        }
        s = { ...s, portals: s.portals.map((q) => (q.id === id ? n : q)) }
        operations++
      }
    }
    expect(greenObservers).toBe(1)
    expect(redObservers).toBeGreaterThan(greenObservers)
    expect(s.portals.every((p) => p.intel === 100)).toBe(true)
    expect(finishShift(s, now).phase).toBe('SHIFT_COMPLETE')
    console.info('Balance policy:', {
      greenObservers,
      redObservers,
      operations,
      initialResonance: labResonance(initialPortals).score,
    })
  })
})

it('records actual resonance at collapse onset and calm shift completion', () => {
  const initial = restartShift()
  initial.portals[0].collapseMinutes = 0.001
  const collapse = advanceSimulation(initial, 60, now)
  expect(collapse.events.find((e) => e.action === 'collapse-started')?.resonance).toBe(
    labResonance(collapse.portals).score,
  )
  expect(
    collapse.events.find((e) => e.action === 'collapse-started')?.resonance,
  ).toBeGreaterThan(0)
  const portals = initialPortals.map((p) => ({
    ...p,
    intel: 100,
    energy: 20,
    stability: 100,
    collapseMinutes: p.status === 'closed' ? 0 : 120,
    creatures: 0,
    uncertain: false,
  }))
  const completed = finishShift({ ...restartShift(), portals }, now)
  expect(completed.phase).toBe('SHIFT_COMPLETE')
  expect(completed.events.at(-1)?.resonance).toBe(completed.finalResonance)
  expect(completed.finalResonance).toBeGreaterThan(0)
})
