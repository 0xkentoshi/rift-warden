// @vitest-environment jsdom
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useKeyboardMovement } from '../hooks/useKeyboardMovement'
let callback: FrameRequestCallback
let now: number
beforeEach(() => {
  now = 100
  vi.spyOn(performance, 'now').mockReturnValue(now)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    callback = cb
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const frame = () =>
  act(() => {
    now += 16
    callback(now)
  })
it('walks with physical WASD, stops immediately on release, and uses arrows', () => {
  const { result } = renderHook(() => useKeyboardMovement(true))
  const start = result.current.position
  fireEvent.keyDown(window, { code: 'KeyD', key: 'в' })
  frame()
  expect(result.current.position.x).toBeGreaterThan(start.x)
  expect(result.current.moving).toBe(true)
  fireEvent.keyUp(window, { code: 'KeyD' })
  frame()
  const stopped = result.current.position
  frame()
  frame()
  expect(result.current.position).toEqual(stopped)
  expect(result.current.moving).toBe(false)
  fireEvent.keyDown(window, { code: 'ArrowUp' })
  frame()
  expect(result.current.position.y).toBeLessThan(stopped.y)
})
it('clears held input on blur and when a modal disables movement', () => {
  const { result, rerender } = renderHook(({ enabled }) => useKeyboardMovement(enabled), {
    initialProps: { enabled: true },
  })
  fireEvent.keyDown(window, { code: 'KeyD' })
  frame()
  fireEvent.blur(window)
  frame()
  const stopped = result.current.position
  frame()
  expect(result.current.position).toEqual(stopped)
  fireEvent.keyDown(window, { code: 'KeyW' })
  frame()
  rerender({ enabled: false })
  expect(result.current.moving).toBe(false)
  const locked = result.current.position
  fireEvent.keyDown(window, { code: 'KeyD' })
  rerender({ enabled: true })
  frame()
  expect(result.current.position).toEqual(locked)
})
