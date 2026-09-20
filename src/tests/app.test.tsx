// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from '../App'
import { portalPositions } from '../data/labLayout'
const movementMock = vi.hoisted(() => ({
  setPosition: (_p: { x: number; y: number }) => {},
}))
vi.mock('../hooks/useKeyboardMovement', async () => {
  const { useState } = await import('react')
  return {
    useKeyboardMovement: () => {
      const [position, setPosition] = useState({ x: 836, y: 521 })
      movementMock.setPosition = setPosition
      return { position, direction: 'down', moving: false }
    },
  }
})
function inspect(name: string) {
  const p = initialPortals.find((p) => p.name === name)!
  act(() => movementMock.setPosition(portalPositions[p.id].approach))
  fireEvent.keyDown(window, { code: 'KeyE', key: 'e' })
}

import { initialPortals } from '../data/portals'
import { saveLabState, dismissStorageIssue } from '../storage/labStorage'
beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'performance',
      'Date',
      'setInterval',
      'clearInterval',
    ],
  })
  localStorage.clear()
  localStorage.setItem('rift-warden-onboarding-seen', 'yes')
  dismissStorageIssue()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
describe('operator workflows', () => {
  it('remotely inspects live telemetry, enables control only within reach and revokes it on leaving', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Mossbound Door' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('READ ONLY')
    expect(dialog).toHaveTextContent('DIFFICULTY')
    expect(dialog).toHaveTextContent('INTEL')
    const actions = () =>
      Array.from(dialog.querySelectorAll<HTMLButtonElement>('.portal-action'))
    expect(actions()).toHaveLength(5)
    actions().forEach((button) => expect(button).toBeDisabled())
    const timer = dialog.querySelectorAll('.metric')[2].textContent
    const stability = dialog.querySelectorAll('.metric')[1].textContent
    act(() => vi.advanceTimersByTime(60000))
    expect(document.querySelector('.app-shell')).toHaveAttribute(
      'data-game-phase',
      'RUNNING',
    )
    expect(dialog.querySelectorAll('.metric')[2].textContent).not.toBe(timer)
    expect(dialog.querySelectorAll('.metric')[1].textContent).not.toBe(stability)
    act(() => movementMock.setPosition(portalPositions['mossbound-door'].approach))
    expect(dialog).toHaveTextContent('FULL CONTROL')
    expect(within(dialog).getByRole('button', { name: /^STABILIZE/ })).toBeEnabled()
    fireEvent.click(within(dialog).getByRole('button', { name: /^STABILIZE/ }))
    expect(screen.getByRole('region', { name: 'Action preview' })).toBeInTheDocument()
    act(() => movementMock.setPosition({ x: 836, y: 521 }))
    actions().forEach((button) => expect(button).toBeDisabled())
    expect(
      screen.queryByRole('region', { name: 'Action preview' }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('.portal-history')).not.toHaveTextContent('STABILIZE')
  })
  it('rejects critical observation, stabilizes and records both outcomes in portal history', () => {
    render(<App />)
    inspect('Crimson Gate')
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /SEND OBSERVER/ }))
    expect(within(dialog).getByRole('status')).toHaveTextContent('ACTION REJECTED')
    expect(document.querySelector('.portal-history')).toHaveTextContent(
      'forbidden while portal risk',
    )
  })
  it('updates risk, recommendation, audit and counters after stabilization', () => {
    render(<App />)
    inspect('Crimson Gate')
    fireEvent.click(screen.getByRole('button', { name: /^STABILIZE/ }))
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('90')
    expect(screen.getByRole('region', { name: 'Action preview' })).toHaveTextContent(
      '45 MEDIUM',
    )
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }))
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('45')
    expect(document.querySelector('.portal-history')).toHaveTextContent('90 → 45')
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.hud__stat--critical')).toHaveTextContent('0')
    expect(document.querySelector('.portal-label')).toHaveTextContent('Crimson Gate')
  })
  it('requires confirmation before closing with creatures and rejects actions once closed', () => {
    render(<App />)
    inspect('Crimson Gate')
    fireEvent.click(screen.getByRole('button', { name: /^CLOSE PORTAL/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('3 creature(s)')
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^CLOSE PORTAL/ }))
    fireEvent.click(screen.getByRole('button', { name: 'FORCE CLOSE' }))
    expect(document.querySelector('.recommendation')).toHaveTextContent('Portal closed')
    act(() => vi.advanceTimersByTime(701))
    fireEvent.click(screen.getByRole('button', { name: /^STABILIZE/ }))
    expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent(
      'already closed',
    )
    expect(document.querySelector('.portal-history')).toHaveTextContent('REJECTED')
  })
  it('has a recoverable empty scenario, registry and a visible bilingual AI worklog', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'SYSTEM' }))
    fireEvent.click(screen.getByRole('button', { name: 'LOAD EMPTY-LAB SCENARIO' }))
    expect(screen.getByText('NO ACTIVE PORTALS')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Crimson Gate' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTART SHIFT' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTART SHIFT' }))
    fireEvent.click(screen.getByRole('button', { name: /PORTAL REGISTRY/ }))
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7)
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'RU' }))
    fireEvent.click(screen.getByRole('button', { name: /AI WORKLOG/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('9 × 5-часовых лимитных окон')
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Суммарное количество токенов не подсчитывалось',
    )
    expect(document.documentElement.lang).toBe('ru')
  })
  it('does not mutate a cancelled preview; confirms once despite double clicks and keyboard spam', () => {
    render(<App />)
    inspect('Crimson Gate')
    fireEvent.click(screen.getByRole('button', { name: /^STABILIZE/ }))
    fireEvent.keyDown(screen.getByRole('button', { name: 'CANCEL' }), {
      key: 'Escape',
      code: 'Escape',
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Action preview' }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('90')
    fireEvent.click(screen.getByRole('button', { name: /^STABILIZE/ }))
    const confirm = screen.getByRole('button', { name: 'CONFIRM' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    fireEvent.keyDown(window, { code: 'KeyE' })
    expect(document.querySelectorAll('.portal-history li')).toHaveLength(1)
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('45')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /EXECUTING/ })).toBeDisabled()
  })
  it('persists dangerous closure and its acknowledged warning through reload and language changes', () => {
    const app = render(<App />)
    inspect('Crimson Gate')
    fireEvent.click(screen.getByRole('button', { name: /^CLOSE PORTAL/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Переключить на русский' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Внутри осталось существ: 3')
    fireEvent.click(screen.getByRole('button', { name: 'ЗАКРЫТЬ ПРИНУДИТЕЛЬНО' }))
    expect(document.querySelector('.portal-history')).toHaveTextContent(
      'Предупреждение подтверждено',
    )
    app.unmount()
    render(<App />)
    inspect('Crimson Gate')
    expect(document.querySelector('.recommendation')).toHaveTextContent('Портал закрыт')
    expect(document.querySelector('.portal-history')).toHaveTextContent(
      'Предупреждение подтверждено',
    )
  })
  it('cancels reset without changes and restores demo, position, history and runtime after confirmation', () => {
    render(<App />)
    inspect('Crimson Gate')
    fireEvent.click(screen.getByRole('button', { name: /^STABILIZE/ }))
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTART SHIFT' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(document.querySelector('.hud__stat--critical')).toHaveTextContent('0')
    fireEvent.click(screen.getByRole('button', { name: 'RESTART SHIFT' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTART SHIFT' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.hud__stat--critical')).toHaveTextContent('1')
    expect(document.querySelector('.character')).toHaveAttribute('data-x', '836')
    expect(document.querySelector('.world-toast')).toBeNull()
    inspect('Crimson Gate')
    expect(document.querySelector('.portal-history li')).toBeNull()
  })
})

const readGame = () => JSON.parse(localStorage.getItem('rift-warden-state-v3')!)
const click = (name: string | RegExp) => {
  if (typeof name === 'string' && name.startsWith('INSPECT ')) {
    inspect(name.slice(8))
    return
  }
  fireEvent.click(screen.getByRole('button', { name }))
}
const escape = () => fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
describe('gameplay lifecycle in the application', () => {
  it('holds onboarding until Start, remembers acknowledgement, and allows reopening help', () => {
    localStorage.removeItem('rift-warden-onboarding-seen')
    const app = render(<App />)
    expect(screen.getByRole('dialog')).toHaveTextContent('How to play')
    act(() => vi.advanceTimersByTime(120000))
    expect(readGame().elapsedMs).toBe(0)
    escape()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    click('START SHIFT')
    expect(localStorage.getItem('rift-warden-onboarding-seen')).toBe('yes')
    act(() => vi.advanceTimersByTime(1000))
    expect(readGame().elapsedMs).toBe(1000)
    app.unmount()
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
    click('HOW TO PLAY')
    expect(screen.getByRole('dialog')).toHaveTextContent('How to play')
  })
  it.each([
    'Settings',
    'SYSTEM',
    'EVENT LOG',
    /PORTAL REGISTRY/,
    /AI WORKLOG/,
    'HOW TO PLAY',
  ])('pauses all gameplay in %s and resumes without catch-up', (name) => {
    render(<App />)
    act(() => vi.advanceTimersByTime(1000))
    const before = readGame()
    click(name)
    act(() => vi.advanceTimersByTime(120000))
    expect(readGame()).toEqual(before)
    expect(document.querySelector('[data-game-phase]')).toHaveAttribute(
      'data-game-phase',
      'PAUSED',
    )
    escape()
    act(() => vi.advanceTimersByTime(1000))
    expect(readGame().elapsedMs).toBe(before.elapsedMs + 1000)
    expect(readGame().portals[0].collapseMinutes).toBeCloseTo(
      before.portals[0].collapseMinutes - 1 / 60,
    )
  })
  it('keeps previews live, freezes hidden tab time and uses a fresh anchor on reload', () => {
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const app = render(<App />)
    click('INSPECT Crimson Gate')
    click(/^STABILIZE/)
    const beforePreview = readGame()
    act(() => vi.advanceTimersByTime(120000))
    expect(readGame().elapsedMs).toBe(beforePreview.elapsedMs + 120000)
    const initial = readGame()
    click('CANCEL')
    escape()
    act(() => {
      hidden = true
      document.dispatchEvent(new Event('visibilitychange'))
    })
    act(() => vi.advanceTimersByTime(120000))
    expect(readGame()).toEqual(initial)
    act(() => {
      hidden = false
      document.dispatchEvent(new Event('visibilitychange'))
    })
    act(() => vi.advanceTimersByTime(500))
    expect(readGame().elapsedMs).toBe(initial.elapsedMs + 500)
    app.unmount()
    act(() => vi.advanceTimersByTime(600000))
    render(<App />)
    expect(readGame().elapsedMs).toBe(initial.elapsedMs + 500)
    act(() => vi.advanceTimersByTime(500))
    expect(readGame().elapsedMs).toBe(initial.elapsedMs + 1000)
  })
  it('applies a paid observer once and records its atomic return separately', () => {
    render(<App />)
    click('INSPECT Mossbound Door')
    click(/^SEND OBSERVER/)
    expect(screen.getByRole('region', { name: 'Action preview' })).toHaveTextContent(
      '70% → 100%',
    )
    expect(screen.getByRole('region', { name: 'Action preview' })).toHaveTextContent(
      '47% → 51%',
    )
    click('CONFIRM')
    expect(
      readGame().portals.find((p: { difficulty: number }) => p.difficulty === 1),
    ).toMatchObject({ intel: 100, energy: 51, observerCount: 1 })
    expect(readGame().events.map((e: { action: string }) => e.action)).toEqual([
      'observe',
      'observer-returned',
    ])
    act(() => vi.advanceTimersByTime(701))
    click(/^SEND OBSERVER/)
    expect(readGame().events.at(-1)).toMatchObject({
      status: 'rejected',
      reasonCode: 'fullyResearched',
    })
  })
  it('freezes a completed shift, keeps the incident log, and restarts all gameplay while preserving preferences', () => {
    const seed = JSON.parse(JSON.stringify(initialPortals))
    for (const p of seed) {
      p.status = 'closed'
      p.energy = 0
      p.stability = 100
      p.collapseMinutes = 0
    }
    seed[4] = { ...initialPortals[4] }
    saveLabState(seed, [])
    localStorage.setItem('rift-warden-music', 'off')
    localStorage.setItem('rift-warden-volume', '0.12')
    render(<App />)
    click('INSPECT Azure Bloom')
    click(/^SAFE CLOSE/)
    click('CONFIRM')
    expect(screen.getByRole('dialog')).toHaveTextContent('Shift complete')
    const complete = readGame()
    act(() => vi.advanceTimersByTime(120000))
    expect(readGame()).toEqual(complete)
    click('VIEW INCIDENT LOG')
    expect(screen.getByRole('dialog')).toHaveTextContent('SAFE CLOSE')
    expect(screen.queryByRole('button', { name: 'CLEAR LOG' })).toBeNull()
    escape()
    click('RESTART SHIFT')
    click('CANCEL')
    expect(screen.getByRole('dialog')).toHaveTextContent('Shift complete')
    click('RESTART SHIFT')
    click('RESTART SHIFT')
    expect(readGame()).toMatchObject({
      portals: initialPortals,
      events: [],
      phase: 'RUNNING',
      elapsedMs: 0,
    })
    expect(localStorage.getItem('rift-warden-music')).toBe('off')
    expect(localStorage.getItem('rift-warden-volume')).toBe('0.12')
    expect(localStorage.getItem('rift-warden-onboarding-seen')).toBe('yes')
    expect(document.querySelector('.character')).toHaveAttribute('data-x', '836')
    expect(document.querySelector('.world-toast')).toBeNull()
  })
  it('shows one game-over screen after a cascade and stops all simulation', () => {
    saveLabState(
      initialPortals.map((p) => ({
        ...p,
        status: 'open',
        energy: 99,
        stability: 1,
        collapseMinutes: 0.001,
      })),
      [],
    )
    render(<App />)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByRole('dialog')).toHaveTextContent('Laboratory lost')
    const lost = readGame()
    expect(
      lost.events.filter((e: { action: string }) => e.action === 'lab-lost'),
    ).toHaveLength(1)
    act(() => vi.advanceTimersByTime(120000))
    expect(readGame()).toEqual(lost)
    click('VIEW INCIDENT LOG')
    expect(screen.getByRole('dialog')).toHaveTextContent('RESONANCE SHOCK')
    escape()
    click('RESTART SHIFT')
    click('RESTART SHIFT')
    expect(readGame()).toMatchObject({
      portals: initialPortals,
      events: [],
      phase: 'RUNNING',
    })
  })
})

it('portal and live preview keep running at 5x; current values are committed', () => {
  render(<App />)
  fireEvent.change(screen.getByRole('combobox', { name: 'Simulation speed' }), {
    target: { value: '5' },
  })
  inspect('Crimson Gate')
  click(/^STABILIZE/)
  const before = readGame()
  act(() => vi.advanceTimersByTime(2000))
  expect(document.querySelector('[data-game-phase]')).toHaveAttribute(
    'data-game-phase',
    'RUNNING',
  )
  expect(readGame().portals[0].collapseMinutes).toBeCloseTo(
    before.portals[0].collapseMinutes - 10 / 60,
  )
  const current = readGame().portals[0]
  click('CONFIRM')
  expect(readGame().portals[0].collapseMinutes).toBeCloseTo(current.collapseMinutes + 15)
  expect(readGame().portals[0].stability).toBeCloseTo(current.stability + 30)
})
it('a live observer preview is rejected when countdown makes current risk critical', () => {
  const p = {
    ...initialPortals[0],
    energy: 75,
    stability: 20,
    collapseMinutes: 5.01,
    creatures: 0,
  }
  saveLabState([p], [])
  render(<App />)
  inspect(p.name)
  click(/^SEND OBSERVER/)
  act(() => vi.advanceTimersByTime(1000))
  click('CONFIRM')
  expect(readGame().events.at(-1)).toMatchObject({
    status: 'rejected',
    reasonCode: 'criticalObserver',
  })
  expect(readGame().portals[0].intel).toBe(p.intel)
})
