import type { Portal } from '../../types/portal'
export function observerTradeoff(p: Portal) {
  const base = Math.max(
    8,
    Math.floor((32 - 2 * p.difficulty) / (1 + 0.3 * p.observerCount)),
  )
  return {
    intel: Math.min(100 - p.intel, Math.floor(base * (p.uncertain ? 1.25 : 1))),
    energy: Math.max(
      1,
      Math.round(
        (4 + 2 * (p.difficulty - 1) + 2 * p.observerCount) * (p.uncertain ? 0.8 : 1),
      ),
    ),
  }
}
