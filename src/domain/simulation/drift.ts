import type { Portal } from '../../types/portal'
export const TIME_SCALES = [0.5, 1, 1.5, 2, 5] as const
export const DRIFT_PER_MINUTE = [0.1, 0.15, 0.2, 0.3, 0.4, 0.5]
export function driftStability(p: Portal, elapsedMs: number) {
  if (p.status !== 'open' && p.status !== 'quarantined') return p.stability
  const rate = DRIFT_PER_MINUTE[p.difficulty - 1] ?? 0.1
  return Math.max(
    0,
    Math.min(
      100,
      p.stability -
        ((rate * elapsedMs) / 60000) *
          (p.status === 'quarantined' ? 0.25 : 1) *
          (p.uncertain ? 0.65 : 1),
    ),
  )
}
