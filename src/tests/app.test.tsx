// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from '../App'
import { dismissStorageIssue } from '../storage/labStorage'
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance', 'Date'] })
  localStorage.clear()
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
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('93')
    expect(screen.getByRole('region', { name: 'Action preview' })).toHaveTextContent(
      '38 MEDIUM',
    )
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRM' }))
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('38')
    expect(document.querySelector('.portal-history')).toHaveTextContent('93 → 38')
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
    fireEvent.click(screen.getByRole('button', { name: 'SYSTEM' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTORE DEMO LAB' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTORE' }))
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
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('93')
    fireEvent.click(screen.getByRole('button', { name: /^STABILIZE/ }))
    const confirm = screen.getByRole('button', { name: 'CONFIRM' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    fireEvent.keyDown(window, { code: 'KeyE' })
    expect(document.querySelectorAll('.portal-history li')).toHaveLength(1)
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('38')
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
    fireEvent.click(screen.getByRole('button', { name: 'RESET LAB' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(document.querySelector('.hud__stat--critical')).toHaveTextContent('0')
    fireEvent.click(screen.getByRole('button', { name: 'RESET LAB' }))
    fireEvent.click(screen.getByRole('button', { name: 'RESTORE' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.hud__stat--critical')).toHaveTextContent('1')
    expect(document.querySelector('.character')).toHaveAttribute('data-x', '836')
    expect(document.querySelector('.world-toast')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'INSPECT Crimson Gate' }))
    expect(document.querySelector('.portal-history li')).toBeNull()
  })
})
