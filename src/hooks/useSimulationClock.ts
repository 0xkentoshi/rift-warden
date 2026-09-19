import { useEffect, useLayoutEffect, useRef } from 'react'
import { SimulationClock, type GamePhase } from '../domain/simulation/runtime'

export function useSimulationClock(
  phase: GamePhase,
  onAdvance: (elapsedMs: number) => void,
) {
  const callback = useRef(onAdvance)
  useLayoutEffect(() => {
    callback.current = onAdvance
  }, [onAdvance])
  useEffect(() => {
    const clock = new SimulationClock()
    clock.reset(performance.now())
    if (phase !== 'RUNNING') return
    const timer = setInterval(() => {
      const elapsed = clock.sample(performance.now(), phase)
      if (elapsed > 0) callback.current(elapsed)
    }, 500)
    return () => clearInterval(timer)
  }, [phase])
}
