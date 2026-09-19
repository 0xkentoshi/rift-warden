// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react'
import { afterEach, it, expect } from 'vitest'
import { EventChanges } from '../components/ui/EventChanges'
import type { AuditEvent } from '../types/audit'
afterEach(cleanup)
const base: AuditEvent = {
  id: 'a',
  portalId: 'red',
  portalName: 'Red',
  timestamp: '2026-09-19T12:00:00Z',
  action: 'stabilize',
  status: 'success',
  beforeRisk: 93,
  afterRisk: 38,
}
it('shows changed risk but suppresses unchanged scores', () => {
  const { container, rerender } = render(<EventChanges event={base} language="en" />)
  expect(container.textContent).toContain('93 → 38')
  rerender(<EventChanges event={{ ...base, afterRisk: 93 }} language="en" />)
  expect(container.textContent).not.toContain('93')
})
it('shows paid research independently of an unchanged risk score', () => {
  const { container } = render(
    <EventChanges
      event={{
        ...base,
        action: 'observe',
        afterRisk: 93,
        beforeIntel: 10,
        afterIntel: 30,
        beforeEnergy: 50,
        afterEnergy: 60,
      }}
      language="en"
    />,
  )
  expect(container.textContent).toContain('10% → 30%')
  expect(container.textContent).toContain('50% → 60%')
  expect(container.textContent).not.toContain('93')
})
it('shows a rejected reason and current risk without a fake transition', () => {
  const { container } = render(
    <EventChanges
      event={{
        ...base,
        action: 'observe',
        status: 'rejected',
        afterRisk: 93,
        reasonCode: 'criticalObserver',
      }}
      language="en"
    />,
  )
  expect(container.textContent).toContain('Current risk: 93')
  expect(container.textContent).toContain('forbidden')
  expect(container.textContent).not.toContain('→')
})
it('labels forced closure and confirmed occupants explicitly in Russian', () => {
  const { container } = render(
    <EventChanges
      event={{
        ...base,
        action: 'close',
        closure: 'forced',
        reasonCode: 'creaturesInside',
        creatureCount: 3,
        afterRisk: 0,
      }}
      language="ru"
    />,
  )
  expect(container.textContent).toContain('ПРИНУДИТЕЛЬНОЕ ЗАКРЫТИЕ')
  expect(container.textContent).toContain('Предупреждение подтверждено')
  expect(container.textContent).toContain('3')
})
