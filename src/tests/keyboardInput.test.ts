import { describe, expect, it } from 'vitest'

import {
  getMovementVector,
  isInteractionCode,
} from '../domain/input/keyboard'

describe('keyboard input', () => {
  it('uses physical KeyW for upward movement', () => {
    const movement = getMovementVector(new Set(['KeyW']))

    expect(movement.dx).toBe(0)
    expect(movement.dy).toBe(-1)
    expect(movement.direction).toBe('up')
  })

  it('keeps arrow keys as an alternative movement scheme', () => {
    const movement = getMovementVector(new Set(['ArrowRight']))

    expect(movement.dx).toBe(1)
    expect(movement.dy).toBe(0)
    expect(movement.direction).toBe('right')
  })

  it('uses physical KeyE for interaction regardless of keyboard layout', () => {
    expect(isInteractionCode('KeyE')).toBe(true)
    expect(isInteractionCode('KeyW')).toBe(false)
  })
})
