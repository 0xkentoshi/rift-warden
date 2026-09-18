import { useEffect, useRef } from 'react'

export function AnimatedRisk({ score }: { score: number }) {
  const number = useRef<HTMLSpanElement>(null)
  const previous = useRef(score)
  useEffect(() => {
    const from = previous.current
    previous.current = score
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const started = performance.now()
    let frame = 0
    const update = (now: number) => {
      const progress = Math.min(1, (now - started) / 650)
      if (number.current)
        number.current.textContent = String(
          Math.round(from + (score - from) * (1 - (1 - progress) ** 3)),
        )
      if (progress < 1) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [score])
  return (
    <div className="risk-console__score" aria-label={String(score)}>
      <span ref={number} aria-hidden="true">
        {score}
      </span>
    </div>
  )
}
