// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from '../App'
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
  it('rejects critical observation, stabilizes and records both outcomes in portal history', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /SEND OBSERVER/ }))
    expect(within(dialog).getByRole('status')).toHaveTextContent('ACTION REJECTED')
    expect(document.querySelector('.portal-history')).toHaveTextContent(
      'forbidden while portal risk',
    )
  })
  it('updates risk, recommendation, audit and counters after stabilization', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
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
    expect(document.querySelector('.portal-label')).toBeNull()
  })
  it('requires confirmation before closing with creatures and rejects actions once closed', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
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
    expect(
      screen.queryByRole('button', { name: 'INSPECT Crimson Gate' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTART SHIFT' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTART SHIFT' }))
    fireEvent.click(screen.getByRole('button', { name: /PORTAL REGISTRY/ }))
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7)
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'RU' }))
    fireEvent.click(screen.getByRole('button', { name: /AI WORKLOG/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Не подсчитывались')
    expect(document.documentElement.lang).toBe('ru')
  })
  it('does not mutate a cancelled preview; confirms once despite double clicks and keyboard spam', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
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
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
    fireEvent.click(screen.getByRole('button', { name: /^CLOSE PORTAL/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Переключить на русский' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Внутри осталось существ: 3')
    fireEvent.click(screen.getByRole('button', { name: 'ЗАКРЫТЬ ПРИНУДИТЕЛЬНО' }))
    expect(document.querySelector('.portal-history')).toHaveTextContent(
      'Предупреждение подтверждено',
    )
    app.unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'ОСМОТРЕТЬ Crimson Gate' }))
    expect(document.querySelector('.recommendation')).toHaveTextContent('Портал закрыт')
    expect(document.querySelector('.portal-history')).toHaveTextContent(
      'Предупреждение подтверждено',
    )
  })
  it('cancels reset without changes and restores demo, position, history and runtime after confirmation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
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
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
    expect(document.querySelector('.portal-history li')).toBeNull()
  })
})

const readGame = () => JSON.parse(localStorage.getItem('rift-warden-state-v3')!)
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }))
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
    'INSPECT Crimson Gate',
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
  it('freezes preview and hidden tab time and uses a fresh anchor on reload', () => {
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const app = render(<App />)
    click('INSPECT Crimson Gate')
    click(/^STABILIZE/)
    const initial = readGame()
    act(() => vi.advanceTimersByTime(120000))
    expect(readGame()).toEqual(initial)
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
    expect(readGame().elapsedMs).toBe(500)
    app.unmount()
    act(() => vi.advanceTimersByTime(600000))
    render(<App />)
    expect(readGame().elapsedMs).toBe(500)
    act(() => vi.advanceTimersByTime(500))
    expect(readGame().elapsedMs).toBe(1000)
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
