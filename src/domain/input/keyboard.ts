export type MovementDirection = 'up' | 'down' | 'left' | 'right'

export interface MovementVector {
  dx: number
  dy: number
  direction: MovementDirection | null
}

const MOVEMENT_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
])

export function isMovementCode(code: string): boolean {
  return MOVEMENT_CODES.has(code)
}

export function isInteractionCode(code: string): boolean {
  return code === 'KeyE'
}

export function getMovementVector(
  pressedCodes: ReadonlySet<string>,
): MovementVector {
  let dx = 0
  let dy = 0
  let direction: MovementDirection | null = null

  if (pressedCodes.has('KeyW') || pressedCodes.has('ArrowUp')) {
    dy -= 1
    direction = 'up'
  }

  if (pressedCodes.has('KeyS') || pressedCodes.has('ArrowDown')) {
    dy += 1
    direction = 'down'
  }

  if (pressedCodes.has('KeyA') || pressedCodes.has('ArrowLeft')) {
    dx -= 1
    direction = 'left'
  }

  if (pressedCodes.has('KeyD') || pressedCodes.has('ArrowRight')) {
    dx += 1
    direction = 'right'
  }

  if (dx !== 0 && dy !== 0) {
    const diagonalNormalizer = Math.SQRT1_2
    dx *= diagonalNormalizer
    dy *= diagonalNormalizer
  }

  return {
    dx,
    dy,
    direction,
  }
}
