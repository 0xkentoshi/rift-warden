import { useEffect, useRef, useState } from 'react'
import { START_POSITION, type Point } from '../data/labLayout'
import {
  getMovementVector,
  isMovementCode,
  type MovementDirection,
} from '../domain/input/keyboard'
import { moveWithCollisions } from '../game/geometry'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    !!target.closest(
      'button, select, input, textarea, a, summary, [role="button"], [contenteditable="true"]',
    )
  )
}

export function useKeyboardMovement(enabled: boolean, timeScale = 1) {
  const [state, setState] = useState({
    position: START_POSITION,
    direction: 'down' as MovementDirection,
    moving: false,
  })
  const positionRef = useRef<Point>(START_POSITION)
  useEffect(() => {
    if (!enabled) return
    const pressed = new Set<string>()
    let frame = 0
    let last = performance.now()
    const keydown = (event: KeyboardEvent) => {
      if (!isMovementCode(event.code) || event.ctrlKey || event.metaKey || event.altKey)
        return
      if (
        isInteractiveTarget(event.target) ||
        isInteractiveTarget(document.activeElement)
      )
        return
      event.preventDefault()
      pressed.add(event.code)
    }
    const keyup = (event: KeyboardEvent) => {
      pressed.delete(event.code)
    }
    const clear = () => {
      pressed.clear()
      setState((s) => (s.moving ? { ...s, moving: false } : s))
    }
    const clearForControl = (event: Event) => {
      if (isInteractiveTarget(event.target)) clear()
    }
    const tick = (time: number) => {
      const seconds = Math.min((time - last) / 1000, 0.04)
      last = time
      const vector = getMovementVector(pressed)
      const previous = positionRef.current
      const position = moveWithCollisions(previous, {
        x: vector.dx * 170 * timeScale * seconds,
        y: vector.dy * 170 * timeScale * seconds,
      })
      const movedX = position.x - previous.x,
        movedY = position.y - previous.y
      const moving = Math.hypot(movedX, movedY) > 0.01
      const facing: MovementDirection | null = moving
        ? Math.abs(movedX) > Math.abs(movedY)
          ? movedX > 0
            ? 'right'
            : 'left'
          : movedY > 0
            ? 'down'
            : 'up'
        : vector.direction
      positionRef.current = position
      setState((s) =>
        !moving && !s.moving && (!facing || facing === s.direction)
          ? s
          : { position, moving, direction: facing ?? s.direction },
      )
      frame = requestAnimationFrame(tick)
    }
    document.addEventListener('pointerdown', clearForControl, true)
    document.addEventListener('mousedown', clearForControl, true)
    document.addEventListener('focusin', clearForControl)
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', clearForControl, true)
      document.removeEventListener('mousedown', clearForControl, true)
      document.removeEventListener('focusin', clearForControl)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
    }
  }, [enabled, timeScale])
  return { ...state, moving: enabled && state.moving }
}
