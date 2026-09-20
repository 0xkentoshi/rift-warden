import { describe, it, expect } from 'vitest'
import { getMovementVector } from '../domain/input/keyboard'
import {
  colliders,
  portalPositions,
  SCENE,
  START_POSITION,
  type Point,
  walkableZones,
} from '../data/labLayout'
import {
  isBlocked,
  moveWithCollisions,
  nearestPortal,
  screenToScene,
  viewportTransform,
  isWalkable,
} from '../game/geometry'
import { riskToVfx } from '../game/effects'
import { initialPortals } from '../data/portals'
import { priorityPortals, recommendAction } from '../domain/report/recommendation'

describe('scene movement and coordinates', () => {
  it.each([
    ['KeyW', 'ArrowUp'],
    ['KeyA', 'ArrowLeft'],
    ['KeyS', 'ArrowDown'],
    ['KeyD', 'ArrowRight'],
  ])('matches %s and %s', (wasd, arrow) => {
    expect(getMovementVector(new Set([wasd]))).toEqual(
      getMovementVector(new Set([arrow])),
    )
    expect(getMovementVector(new Set([wasd, arrow]))).toEqual(
      getMovementVector(new Set([wasd])),
    )
  })
  it('normalizes diagonals and cancels opposing keys', () => {
    const { dx, dy } = getMovementVector(new Set(['KeyW', 'KeyD']))
    expect(Math.hypot(dx, dy)).toBeCloseTo(1)
    expect(getMovementVector(new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD']))).toMatchObject({
      dx: 0,
      dy: 0,
    })
  })
  it.each([
    [1600, 900],
    [1920, 1080],
    [1440, 900],
    [390, 844],
    [2560, 1080],
  ])('uses one scale at %s × %s and roundtrips points', (w, h) => {
    const transform = viewportTransform(w, h)
    const point = { x: 836, y: 521 }
    const restored = screenToScene(
      {
        x: point.x * transform.scale + transform.x,
        y: point.y * transform.scale + transform.y,
      },
      transform,
    )
    expect(restored.x).toBeCloseTo(point.x)
    expect(restored.y).toBeCloseTo(point.y)
    for (const p of Object.values(portalPositions)) {
      expect(p.core.x * transform.scale + transform.x).toBeGreaterThan(0)
      expect(p.core.x * transform.scale + transform.x).toBeLessThan(w)
      expect(p.label.y * transform.scale + transform.y).toBeLessThan(h)
    }
    expect(SCENE.width / SCENE.height).toBeCloseTo(16 / 9, 2)
  })
  it('blocks walls, all portal structures, rails and furniture', () => {
    expect(isBlocked(START_POSITION)).toBe(false)
    for (const rect of colliders)
      expect(isBlocked({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 })).toBe(
        true,
      )
  })
  it('does not tunnel through a thin collider or drift without input', () => {
    const obstacles = [{ id: 'wall', x: 100, y: 100, width: 15, height: 200 }]
    const next = moveWithCollisions({ x: 50, y: 150 }, { x: 200, y: 0 }, obstacles)
    expect(next.x).toBeLessThan(90)
    expect(next.y).toBe(150)
    expect(moveWithCollisions(START_POSITION, { x: 0, y: 0 })).toEqual(START_POSITION)
  })
  it('slides along a wall while retaining collision clearance', () => {
    const obstacles = [{ id: 'wall', x: 100, y: 100, width: 15, height: 200 }]
    const next = moveWithCollisions({ x: 80, y: 150 }, { x: 50, y: 50 }, obstacles)
    expect(next.x).toBeLessThan(90)
    expect(next.y).toBeCloseTo(200)
    expect(isBlocked(next, obstacles)).toBe(false)
  })
  it.each(['southwest-path', 'southeast-path'])(
    'slides along the diagonal edge of %s instead of stalling',
    (id) => {
      const zone = walkableZones.find((z) => z.id === id)!
      if (zone.type !== 'path') throw new Error('Expected a path')
      const dx = zone.to.x - zone.from.x,
        dy = zone.to.y - zone.from.y
      const length = Math.hypot(dx, dy),
        sign = Math.sign(dx)
      // Stand just inside the lower edge, then press down into the sloped boundary.
      const start = {
        x: (zone.from.x + zone.to.x) / 2 - (dy / length) * sign * 19.8,
        y: (zone.from.y + zone.to.y) / 2 + (dx / length) * sign * 19.8,
      }
      expect(isBlocked(start)).toBe(false)
      let position = start
      for (let frame = 0; frame < 25; frame++) {
        const next = moveWithCollisions(position, { x: 0, y: 2.7 })
        expect(isBlocked(next)).toBe(false)
        expect(Math.hypot(next.x - position.x, next.y - position.y)).toBeLessThanOrEqual(
          2.701,
        )
        position = next
      }
      expect((position.x - start.x) * sign).toBeGreaterThan(10)
      expect(position.y).toBeGreaterThan(start.y)
      expect(moveWithCollisions(position, { x: 0, y: 0 })).toEqual(position)
    },
  )
  it('slides past a rounded furniture corner, but cannot cut through a solid corner', () => {
    const furniture = [{ id: 'cabinet', x: 100, y: 100, width: 60, height: 60 }]
    const next = moveWithCollisions({ x: 90, y: 95 }, { x: 2, y: 0 }, furniture)
    expect(next.x).toBeGreaterThan(90)
    expect(next.y).toBeLessThan(95)
    expect(isBlocked(next, furniture)).toBe(false)
    const walls = [
      { id: 'east', x: 100, y: 0, width: 20, height: 200 },
      { id: 'south', x: 0, y: 100, width: 200, height: 20 },
    ]
    const stop = moveWithCollisions({ x: 88, y: 88 }, { x: 100, y: 100 }, walls)
    expect(stop.x).toBeLessThan(89)
    expect(stop.y).toBeLessThan(89)
  })
  it('makes every interaction point walkable and selects only an in-range portal', () => {
    const ids = Object.keys(portalPositions)
    expect(nearestPortal(START_POSITION, ids)).toBeNull()
    expect(nearestPortal(START_POSITION, [])).toBeNull()
    for (const [id, p] of Object.entries(portalPositions)) {
      expect(isBlocked(p.approach), id).toBe(false)
      expect(nearestPortal(p.approach, ids)).toBe(id)
      expect(
        nearestPortal({ x: p.approach.x, y: p.approach.y + p.interactionRadius + 1 }, [
          id,
        ]),
      ).toBeNull()
    }
  })
  it('all six approaches are reachable from spawn without crossing colliders', () => {
    const step = 10
    const queue: Point[] = [START_POSITION]
    const seen = new Set([START_POSITION.x + ',' + START_POSITION.y])
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i]
      for (const delta of [
        { x: step, y: 0 },
        { x: -step, y: 0 },
        { x: 0, y: step },
        { x: 0, y: -step },
      ]) {
        const n = { x: p.x + delta.x, y: p.y + delta.y }
        const key = n.x + ',' + n.y
        if (seen.has(key) || isBlocked(n)) continue
        if (
          moveWithCollisions(p, delta).x !== n.x ||
          Math.abs(moveWithCollisions(p, delta).y - n.y) > 0.001
        )
          continue
        seen.add(key)
        queue.push(n)
      }
    }
    for (const [id, p] of Object.entries(portalPositions))
      expect(
        queue.some((n) => Math.hypot(n.x - p.approach.x, n.y - p.approach.y) < 15),
        id,
      ).toBe(true)
  })
  it('keeps every stair route open and its side masonry blocked', () => {
    for (const zone of walkableZones) {
      if (zone.type !== 'path' || !zone.portalId) continue
      for (let step = 0; step <= 20; step++) {
        const point = {
          x: zone.from.x + ((zone.to.x - zone.from.x) * step) / 20,
          y: zone.from.y + ((zone.to.y - zone.from.y) * step) / 20,
        }
        expect(isBlocked(point), zone.id + ' step ' + step).toBe(false)
      }
      const rect = portalPositions[zone.portalId].collider
      expect(isBlocked({ x: rect.x + 12, y: rect.y + 60 }), zone.id).toBe(true)
    }
  })
  it('cannot leave the carpet/path/stair union even on a long diagonal movement', () => {
    for (const delta of [
      { x: -900, y: 0 },
      { x: 0, y: -900 },
      { x: 700, y: 600 },
      { x: -700, y: 600 },
    ]) {
      const next = moveWithCollisions(START_POSITION, delta)
      expect(isWalkable(next)).toBe(true)
      expect(isBlocked(next)).toBe(false)
    }
    expect(isWalkable({ x: 500, y: 450 })).toBe(false)
    expect(isWalkable({ x: 1170, y: 760 })).toBe(false)
  })
  it('selects the nearest valid portal when two interaction circles overlap', () => {
    const base = portalPositions['crimson-gate']
    const placements = {
      a: { ...base, approach: { x: 10, y: 10 }, interactionRadius: 40 },
      b: { ...base, approach: { x: 30, y: 10 }, interactionRadius: 40 },
    }
    expect(nearestPortal({ x: 25, y: 10 }, ['a', 'b'], placements)).toBe('b')
    expect(nearestPortal({ x: 200, y: 10 }, ['a', 'b'], placements)).toBeNull()
  })
})
describe('state-driven presentation', () => {
  it('increases particles, speed and glow with risk and quiets closed portals', () => {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
    levels.slice(1).forEach((level, i) => {
      const next = riskToVfx(level, 'open'),
        previous = riskToVfx(levels[i], 'open')
      expect(next.particles).toBeGreaterThan(previous.particles)
      expect(next.speed).toBeGreaterThan(previous.speed)
      expect(next.glow).toBeGreaterThan(previous.glow)
    })
    expect(riskToVfx('CRITICAL', 'closed').glow).toBeLessThan(
      riskToVfx('LOW', 'open').glow,
    )
    expect(riskToVfx('CRITICAL', 'open').particles).toBeGreaterThanOrEqual(
      riskToVfx('LOW', 'open').particles * 10,
    )
    expect(Object.values(riskToVfx('CRITICAL', 'closed')).every((v) => v === 0)).toBe(
      true,
    )
  })
  it('recommends safe actions and sorts the priority queue by risk', () => {
    expect(recommendAction(initialPortals[0])).toBe('stabilize')
    expect(recommendAction(initialPortals[4])).toBe('close')
    expect(recommendAction(initialPortals[5])).toBe('closed')
    expect(priorityPortals(initialPortals).map((p) => p.id)).toEqual([
      'crimson-gate',
      'void-passage',
      'mirror-rift',
    ])
    expect(priorityPortals([])).toEqual([])
  })
})
it('allows interaction in the enlarged approach radius but not remotely', () => {
  const radii = [58, 50, 58, 56, 56, 44]
  Object.entries(portalPositions).forEach(([id, placement], i) => {
    expect(placement.interactionRadius).toBe(radii[i])
    expect(
      nearestPortal({ x: placement.approach.x, y: placement.approach.y + radii[i] - 1 }, [
        id,
      ]),
    ).toBe(id)
    expect(
      nearestPortal({ x: placement.approach.x, y: placement.approach.y + radii[i] + 1 }, [
        id,
      ]),
    ).toBe(null)
  })
})
