import { useEffect, useRef } from 'react'
import { ambientLights, portalPositions, SCENE } from '../../data/labLayout'
import { calculateRisk } from '../../domain/risk/calculateRisk'
import { riskToVfx } from '../../game/effects'
import type { Portal } from '../../types/portal'

export function SceneEffects({ portals }: { portals: Portal[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const states = Object.entries(portalPositions).map(([id, placement]) => {
      const portal = portals.find((p) => p.id === id)
      const risk = portal ? calculateRisk(portal) : null
      return {
        placement,
        closed: !portal || portal.status === 'closed',
        color: risk?.level === 'CRITICAL' ? '#ff383c' : placement.color,
        fx: riskToVfx(risk?.level ?? 'LOW', portal?.status ?? 'closed'),
      }
    })
    let frame = 0
    const draw = (now: number) => {
      const time = motion.matches ? 0 : now / 1000
      ctx.clearRect(0, 0, SCENE.width, SCENE.height)
      for (const { placement: p, closed, color, fx } of states) {
        const wave = 0.7 + 0.3 * Math.sin(time * fx.pulse * 3)
        // The closed core is genuinely dim; baked scene art contains no moving portal interiors.
        ctx.save()
        ctx.translate(p.core.x, p.core.y)
        ctx.scale(p.radius.x, p.radius.y)
        ctx.beginPath()
        ctx.arc(0, 0, 1.13, 0, Math.PI * 2)
        ctx.clip()
        ctx.fillStyle = closed ? '#0d0b14' : '#04060c'
        ctx.fillRect(-2, -2, 4, 4)
        const glow = ctx.createRadialGradient(0, 0, 0.12, 0, 0, 1.15)
        glow.addColorStop(0, '#04050c')
        glow.addColorStop(0.55, closed ? '#080710' : color + '16')
        glow.addColorStop(0.86, color + (closed ? '05' : '50'))
        glow.addColorStop(1, color + (closed ? '12' : 'ef'))
        ctx.fillStyle = glow
        ctx.fillRect(-2, -2, 4, 4)
        ctx.lineWidth = 0.025
        for (let ring = 0; ring < 5; ring++) {
          const radius = 0.18 + ((ring / 5 + time * fx.speed * 0.23) % 1) * 0.83
          ctx.globalAlpha = (closed ? 0.03 : 0.55) * (1 - radius * 0.6)
          ctx.strokeStyle = color
          const angle = time * fx.speed + ring * 1.9
          ctx.beginPath()
          ctx.ellipse(
            Math.sin(time + ring) * 0.06,
            0,
            radius,
            radius,
            Math.sin(time * 0.3) * 0.2,
            angle,
            angle + Math.PI * 1.2,
          )
          ctx.stroke()
        }
        if (!closed) {
          ctx.globalAlpha = 0.6
          ctx.fillStyle = '#e9ffff'
          ctx.beginPath()
          ctx.arc(
            Math.cos(time * fx.speed) * 0.08,
            Math.sin(time * fx.speed) * 0.08,
            0.045 + wave * 0.02,
            0,
            Math.PI * 2,
          )
          ctx.fill()
        }
        ctx.restore()
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = fx.glow * (0.6 + wave * 0.4)
        const spill = ctx.createRadialGradient(
          p.core.x,
          p.core.y,
          15,
          p.core.x,
          p.core.y,
          125,
        )
        spill.addColorStop(0, color + '00')
        spill.addColorStop(0.48, color + '20')
        spill.addColorStop(1, color + '00')
        ctx.fillStyle = spill
        ctx.fillRect(p.core.x - 125, p.core.y - 125, 250, 250)
        ctx.save()
        ctx.translate(p.core.x, p.core.y + p.radius.y + 30)
        ctx.scale(1, 0.25)
        const ground = ctx.createRadialGradient(0, 0, 0, 0, 0, 120)
        ground.addColorStop(0, color + 'a0')
        ground.addColorStop(1, color + '00')
        ctx.fillStyle = ground
        ctx.fillRect(-120, -120, 240, 240)
        ctx.restore()
        for (let i = 0; i < fx.particles; i++) {
          const phase = (i * 0.618 + time * fx.speed * 0.21) % 1
          const angle = i * 2.399 + time * fx.speed * 0.23
          const x = p.core.x + Math.cos(angle) * (p.radius.x + 24 + (i % 5) * 14)
          const y = p.core.y + 80 - phase * 200 + Math.sin(angle) * 16
          ctx.globalAlpha = Math.sin(phase * Math.PI) * (closed ? 0.18 : 0.95)
          ctx.fillStyle = i % 5 === 0 ? '#fff0dd' : color
          const size = i % 4 === 0 ? 4 : 2
          ctx.fillRect(Math.round(x), Math.round(y), size, size)
          if (i % 7 === 0) {
            ctx.fillRect(x - 3, y + 1, 10, 1)
            ctx.fillRect(x + 1, y - 3, 1, 10)
          }
        }
        ctx.restore()
      }
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ambientLights.forEach((p, i) => {
        const flicker =
          0.1 + (Math.sin(time * 7 + i) + Math.sin(time * 11 + i * 3)) * 0.025
        const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 40)
        glow.addColorStop(0, '#ffbf69')
        glow.addColorStop(1, '#ff8b2400')
        ctx.globalAlpha = flicker
        ctx.fillStyle = glow
        ctx.fillRect(p.x - 40, p.y - 40, 80, 80)
      })
      for (let i = 0; i < 38; i++) {
        const x = 300 + ((i * 97.7 + time * (3 + (i % 3))) % 1072)
        const y = 290 + ((i * 67.1 - time * 4 + 6000) % 480)
        ctx.globalAlpha = 0.15 + Math.sin(time * 0.8 + i) * 0.1
        ctx.fillStyle = '#ffe6ac'
        ctx.fillRect(x, y, 2, 2)
      }
      ctx.restore()
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const restart = () => {
      cancelAnimationFrame(frame)
      draw(performance.now())
    }
    restart()
    motion.addEventListener('change', restart)
    document.addEventListener('visibilitychange', restart)
    return () => {
      cancelAnimationFrame(frame)
      motion.removeEventListener('change', restart)
      document.removeEventListener('visibilitychange', restart)
    }
  }, [portals])
  return (
    <canvas
      className="scene-effects"
      ref={ref}
      width={SCENE.width}
      height={SCENE.height}
      aria-hidden="true"
    />
  )
}
