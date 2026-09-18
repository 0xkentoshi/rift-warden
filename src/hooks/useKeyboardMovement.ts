import { useEffect, useRef, useState } from 'react'
import { START_POSITION, type Point } from '../data/labLayout'
import {
  getMovementVector,
  isMovementCode,
  type MovementDirection,
} from '../domain/input/keyboard'
import { moveWithCollisions } from '../game/geometry'

export function useKeyboardMovement(enabled: boolean) {
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
        event.target instanceof HTMLElement &&
        (event.target.matches('input, textarea, select') ||
          event.target.isContentEditable)
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
    const tick = (time: number) => {
      const seconds = Math.min((time - last) / 1000, 0.04)
      last = time
      const vector = getMovementVector(pressed)
      const previous = positionRef.current
      const position = moveWithCollisions(previous, {
        x: vector.dx * 170 * seconds,
        y: vector.dy * 170 * seconds,
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
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
    }
  }, [enabled])
  return { ...state, moving: enabled && state.moving }
}
