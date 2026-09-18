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
  for (let i = 0; i < steps; i++) {
    const x = { x: next.x + delta.x / steps, y: next.y }
    if (!isBlocked(x, obstacles, constrainToPaths)) next = x
    const y = { x: next.x, y: next.y + delta.y / steps }
    if (!isBlocked(y, obstacles, constrainToPaths)) next = y
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
