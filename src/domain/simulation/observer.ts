import type { Portal } from '../../types/portal'

export function observerTradeoff(p: Portal) {
  return {
    intel: Math.min(
      100 - p.intel,
      Math.max(8, Math.floor((32 - 2 * p.difficulty) / (1 + 0.3 * p.observerCount))),
    ),
    energy: 4 + 2 * (p.difficulty - 1) + 2 * p.observerCount,
  }
}
