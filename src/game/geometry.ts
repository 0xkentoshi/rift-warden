import {
  colliders,
  PLAYER_RADIUS,
  portalPositions,
  SCENE,
  walkableZones,
  type Point,
  type Rect,
  type WalkableZone,
  type PortalPlacement,
} from '../data/labLayout'

export function viewportTransform(width: number, height: number) {
  // Cover desktop ratios; contain narrow screens so no interactive portal is cropped.
  const scale =
    width / height >= 1.3
      ? Math.max(width / SCENE.width, height / SCENE.height)
      : Math.min(width / SCENE.width, height / SCENE.height)
  return {
    scale,
    x: (width - SCENE.width * scale) / 2,
    y: width <= 600 && width / height < 1.3 ? 164 : (height - SCENE.height * scale) / 2,
  }
}
export function screenToScene(
  point: Point,
  transform: ReturnType<typeof viewportTransform>,
): Point {
  return {
    x: (point.x - transform.x) / transform.scale,
    y: (point.y - transform.y) / transform.scale,
  }
}
export function inWalkableZone(point: Point, zone: WalkableZone): boolean {
  if (zone.type === 'ellipse')
    return (
      ((point.x - zone.center.x) / (zone.radius.x - PLAYER_RADIUS)) ** 2 +
        ((point.y - zone.center.y) / (zone.radius.y - PLAYER_RADIUS)) ** 2 <=
      1
    )
  const dx = zone.to.x - zone.from.x,
    dy = zone.to.y - zone.from.y
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - zone.from.x) * dx + (point.y - zone.from.y) * dy) / (dx * dx + dy * dy),
    ),
  )
  return (
    Math.hypot(point.x - zone.from.x - t * dx, point.y - zone.from.y - t * dy) <=
    zone.width / 2 - PLAYER_RADIUS
  )
}
export function isWalkable(point: Point): boolean {
  return walkableZones.some((zone) => inWalkableZone(point, zone))
}
export function isBlocked(
  point: Point,
  obstacles: readonly Rect[] = colliders,
  constrainToPaths = obstacles === colliders,
): boolean {
  if (constrainToPaths && !isWalkable(point)) return true
  if (
    point.x < PLAYER_RADIUS ||
    point.y < PLAYER_RADIUS ||
    point.x > SCENE.width - PLAYER_RADIUS ||
    point.y > SCENE.height - PLAYER_RADIUS
  )
    return true
  return obstacles.some((rect) => {
    if (
      constrainToPaths &&
      walkableZones.some(
        (zone) =>
          zone.type === 'path' &&
          zone.portalId === rect.id &&
          inWalkableZone(point, zone),
      )
    )
      return false
    const x = Math.max(rect.x, Math.min(point.x, rect.x + rect.width))
    const y = Math.max(rect.y, Math.min(point.y, rect.y + rect.height))
    return Math.hypot(point.x - x, point.y - y) <= PLAYER_RADIUS
  })
}
export function moveWithCollisions(
  position: Point,
  delta: Point,
  obstacles: readonly Rect[] = colliders,
  constrainToPaths = obstacles === colliders,
): Point {
  let next = { ...position }
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y) / (PLAYER_RADIUS / 2)))
  const step = { x: delta.x / steps, y: delta.y / steps }
  for (let i = 0; i < steps; i++) {
    const desired = { x: next.x + step.x, y: next.y + step.y }
    if (!isBlocked(desired, obstacles, constrainToPaths)) {
      next = desired
      continue
    }
    // Preserve a free axis, then consider the tangent of a sloping path or rounded
    // obstacle. Every candidate still passes the same collision map; no snapping
    // or teleporting across a narrow gap, and no motion after key release.
    const candidates: Point[] = [
      { x: next.x + step.x, y: next.y },
      { x: next.x, y: next.y + step.y },
    ]
    const slide = (normal: Point) => {
      const length = Math.hypot(normal.x, normal.y)
      if (length < 0.0001) return
      const nx = normal.x / length,
        ny = normal.y / length
      const into = step.x * nx + step.y * ny
      if (into <= 0) return
      const tangent = { x: step.x - nx * into, y: step.y - ny * into }
      if (Math.hypot(tangent.x, tangent.y) < 0.001) return
      // Tiny inward clearance lets a tangent follow a curved edge without snagging.
      candidates.push({
        x: next.x + tangent.x - nx * 0.04,
        y: next.y + tangent.y - ny * 0.04,
      })
    }
    if (constrainToPaths) {
      for (const zone of walkableZones) {
        if (!inWalkableZone(next, zone) || inWalkableZone(desired, zone)) continue
        if (zone.type === 'ellipse') {
          slide({
            x: (next.x - zone.center.x) / (zone.radius.x - PLAYER_RADIUS) ** 2,
            y: (next.y - zone.center.y) / (zone.radius.y - PLAYER_RADIUS) ** 2,
          })
        } else {
          const dx = zone.to.x - zone.from.x,
            dy = zone.to.y - zone.from.y
          const t = Math.max(
            0,
            Math.min(
              1,
              ((next.x - zone.from.x) * dx + (next.y - zone.from.y) * dy) /
                (dx * dx + dy * dy),
            ),
          )
          slide({ x: next.x - zone.from.x - t * dx, y: next.y - zone.from.y - t * dy })
        }
      }
    }
    for (const rect of obstacles) {
      const closest = {
        x: Math.max(rect.x, Math.min(next.x, rect.x + rect.width)),
        y: Math.max(rect.y, Math.min(next.y, rect.y + rect.height)),
      }
      if (
        Math.hypot(next.x - closest.x, next.y - closest.y) <=
        PLAYER_RADIUS + Math.hypot(step.x, step.y)
      )
        slide({ x: closest.x - next.x, y: closest.y - next.y })
    }
    let best = next,
      progress = 0
    for (const candidate of candidates) {
      const dx = candidate.x - next.x,
        dy = candidate.y - next.y
      const forward = dx * step.x + dy * step.y
      if (
        forward > progress &&
        Math.hypot(dx, dy) <= Math.hypot(step.x, step.y) + 0.001 &&
        !isBlocked(candidate, obstacles, constrainToPaths)
      ) {
        best = candidate
        progress = forward
      }
    }
    next = best
  }
  return next
}
export function nearestPortal(
  position: Point,
  ids: readonly string[],
  placements: Record<string, PortalPlacement> = portalPositions,
): string | null {
  let nearest: string | null = null
  let distance = Infinity
  for (const id of ids) {
    const placement = placements[id]
    if (!placement) continue
    const d = Math.hypot(
      position.x - placement.approach.x,
      position.y - placement.approach.y,
    )
    if (d <= placement.interactionRadius && d < distance) {
      nearest = id
      distance = d
    }
  }
  return nearest
}
