// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from '../App'
import { dismissStorageIssue } from '../storage/labStorage'
beforeEach(() => {
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
    expect(document.querySelector('.risk-console__score')).toHaveTextContent('38')
    expect(document.querySelector('.portal-history')).toHaveTextContent('93 → 38')
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.portal-label')).toHaveTextContent('MEDIUM · 38')
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
    fireEvent.click(screen.getByRole('button', { name: /^STABILIZE/ }))
    expect(screen.getByRole('status')).toHaveTextContent('already closed')
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
    fireEvent.click(screen.getByRole('button', { name: /PORTAL REGISTRY/ }))
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7)
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'RU' }))
    fireEvent.click(screen.getByRole('button', { name: /AI WORKLOG/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Не подсчитывались')
    expect(document.documentElement.lang).toBe('ru')
  })
})
