// @vitest-environment jsdom
import { render, cleanup, fireEvent, screen } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { portalPositions, START_POSITION } from '../data/labLayout'
import { initialPortals } from '../data/portals'
import { Laboratory } from '../components/game/Laboratory'
const state = vi.hoisted(() => ({
  position: { x: 836, y: 521 },
  moving: false,
  direction: 'down',
}))
vi.mock('../hooks/useKeyboardMovement', () => ({ useKeyboardMovement: () => state }))
vi.mock('../components/game/SceneEffects', () => ({ SceneEffects: () => null }))
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
it.each(Object.keys(portalPositions))('E inspects %s at its reachable approach', (id) => {
  state.position = portalPositions[id].approach
  const select = vi.fn()
  render(
    <Laboratory
      portals={initialPortals}
      interactionLocked={false}
      language="en"
      onSelectPortal={select}
    >
      {null}
    </Laboratory>,
  )
  fireEvent.keyDown(window, { code: 'KeyE', key: 'у' })
  expect(select).toHaveBeenCalledExactlyOnceWith(id)
  fireEvent.keyDown(window, { code: 'KeyE', repeat: true })
  expect(select).toHaveBeenCalledTimes(1)
})
it('ignores E far away and while a panel is open; portal click remains available', () => {
  state.position = START_POSITION
  const select = vi.fn()
  const { rerender } = render(
    <Laboratory
      portals={initialPortals}
      interactionLocked={false}
      language="en"
      onSelectPortal={select}
    >
      {null}
    </Laboratory>,
  )
  fireEvent.keyDown(window, { code: 'KeyE' })
  expect(select).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'INSPECT Mossbound Door' }))
  expect(select).toHaveBeenCalledExactlyOnceWith('mossbound-door')
  state.position = portalPositions['mossbound-door'].approach
  rerender(
    <Laboratory
      portals={initialPortals}
      interactionLocked={true}
      language="en"
      onSelectPortal={select}
    >
      {null}
    </Laboratory>,
  )
  fireEvent.keyDown(window, { code: 'KeyE' })
  expect(select).toHaveBeenCalledTimes(1)
})
