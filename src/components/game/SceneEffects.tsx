import { useEffect, useRef } from 'react'
import { ambientLights, portalPositions, SCENE } from '../../data/labLayout'
import { calculateRisk, getRiskLevel } from '../../domain/risk/calculateRisk'
import { riskToVfx } from '../../game/effects'
import type { Portal } from '../../types/portal'
import type { AuditEvent } from '../../types/audit'

export function SceneEffects({
  portals,
  nearby,
  lastAction,
}: {
  portals: Portal[]
  nearby: string | null
  lastAction: AuditEvent | null
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.setTransform(0.5, 0, 0, 0.5, 0, 0)
    ctx.imageSmoothingEnabled = false
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const states = Object.entries(portalPositions).map(([id, placement]) => {
      const portal = portals.find((p) => p.id === id)
      const risk = portal ? calculateRisk(portal) : null
      return {
        id,
        creatures: portal?.creatures ?? 0,
        placement,
        closed: !portal || portal.status === 'closed',
        color: risk?.level === 'CRITICAL' ? '#ff383c' : placement.color,
        fx: riskToVfx(risk?.level ?? 'LOW', portal?.status ?? 'closed'),
      }
    })
    let frame = 0
    const draw = (now: number) => {
      const time = motion.matches ? 0 : Math.floor(now / 65) * 0.065
      ctx.clearRect(0, 0, SCENE.width, SCENE.height)
      for (const [index, state] of states.entries()) {
        const { id, placement: p, creatures, closed, color, fx } = state
        const direction = index % 2 ? -1 : 1
        const wave = 0.7 + 0.3 * Math.sin(time * fx.pulse * 3 + index)
        const actionAge =
          lastAction?.portalId === id && lastAction.status === 'success'
            ? (Date.now() - Date.parse(lastAction.timestamp)) / 1000
            : Infinity
        const actionActive = actionAge >= 0 && actionAge < 2.4 && !motion.matches
        const closing = actionActive && lastAction?.action === 'close'
        const jitter = motion.matches
          ? 0
          : fx.shake * Math.sin(time * 37 + index) * Math.sin(time * 19)
        const boost = id === nearby ? 1.18 : 1
        // The closed core is genuinely dim; baked scene art contains no moving portal interiors.
        ctx.save()
        ctx.translate(p.core.x + jitter, p.core.y + jitter * 0.6)
        ctx.scale(p.radius.x, p.radius.y)
        ctx.beginPath()
        ctx.arc(0, 0, 1.13, 0, Math.PI * 2)
        ctx.clip()
        ctx.fillStyle = closed ? '#0d0b14' : '#04060c'
        ctx.fillRect(-2, -2, 4, 4)
        const glow = ctx.createRadialGradient(0, 0, 0.12, 0, 0, 1.15)
        glow.addColorStop(0, '#04050c')
        glow.addColorStop(0.55, closed ? '#080710' : color + '16')
        glow.addColorStop(0.86, color + (closed ? '00' : '50'))
        glow.addColorStop(1, color + (closed ? '00' : 'ef'))
        ctx.fillStyle = glow
        ctx.fillRect(-2, -2, 4, 4)
        ctx.lineWidth = 0.025
        for (let ring = 0; ring < 5; ring++) {
          const radius = 0.18 + ((ring / 5 + time * fx.speed * 0.23) % 1) * 0.83
          ctx.globalAlpha = (closed ? 0.03 : 0.55) * (1 - radius * 0.6)
          ctx.strokeStyle = color
          const angle = time * fx.speed * direction + ring * 1.9
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
        ctx.globalAlpha = Math.min(1, fx.glow * boost * (0.6 + wave * 0.4))
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
          const angle = i * 2.399 + time * fx.speed * 0.23 * direction
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
        // Blocky local outbursts and stepped shockwaves, never camera shake.
        const burstPhase = (time + index * 0.43) % (4.2 - fx.shake * 0.45)
        if (!closed && fx.burst > 0 && burstPhase < 0.65) {
          ctx.save()
          ctx.fillStyle = color
          ctx.globalAlpha = (1 - burstPhase / 0.65) * 0.8
          for (let i = 0; i < fx.burst; i++) {
            const angle = (i * Math.PI * 2) / fx.burst
            const distance = 35 + burstPhase * (70 + fx.speed * 50)
            ctx.fillRect(
              p.core.x + Math.cos(angle) * distance,
              p.core.y + Math.sin(angle) * distance * 1.3,
              4 + (i % 3) * 2,
              4,
            )
          }
          if (fx.shake >= 5)
            pixelRing(
              ctx,
              p.core.x,
              p.core.y,
              60 + burstPhase * 85,
              85 + burstPhase * 85,
              color,
            )
          ctx.restore()
        }
        // One bounded transition sourced only from a successfully committed audit event.
        if (actionActive && lastAction) {
          ctx.save()
          const progress = Math.min(1, actionAge / 1.8)
          ctx.globalAlpha = Math.max(0, 1 - actionAge / 2.4)
          if (lastAction.action === 'stabilize' || closing) {
            const radius = closing ? (1 - progress) * 90 : 105 - progress * 80
            pixelRing(
              ctx,
              p.core.x,
              p.core.y,
              radius,
              radius * 1.3,
              closing ? '#d9ceef' : '#a3ffd7',
            )
            for (let i = 0; i < 16; i++) {
              const angle = i * 2.399
              ctx.fillStyle = closing ? color : '#b7ffe0'
              ctx.fillRect(
                p.core.x + Math.cos(angle) * radius,
                p.core.y + Math.sin(angle) * radius * 1.3,
                4,
                4,
              )
            }
          } else if (lastAction.action === 'observe') {
            const x = p.core.x + (1 - progress) * (index < 3 ? 38 : -38)
            const y = p.core.y + (1 - progress) * 105
            for (let i = 1; i < 7; i++) {
              ctx.fillStyle = '#b6fff077'
              ctx.fillRect(x, y + i * 8, 3, 3)
            }
            creature(ctx, x, y, '#a3fff1')
          } else {
            pixelRing(
              ctx,
              p.core.x,
              p.core.y,
              42 + progress * 35,
              58 + progress * 35,
              '#ffcd76',
            )
            ctx.fillStyle = '#ffdc83'
            ctx.font = 'bold 30px monospace'
            ctx.fillText('?', p.core.x - 8, p.core.y - 15 - progress * 20)
          }
          if (
            getRiskLevel(lastAction.beforeRisk) !== 'CRITICAL' &&
            getRiskLevel(lastAction.afterRisk) === 'CRITICAL'
          ) {
            pixelRing(
              ctx,
              p.core.x,
              p.core.y,
              55 + progress * 60,
              80 + progress * 60,
              '#ff747c',
            )
            ctx.fillStyle = '#ffe3db'
            ctx.font = 'bold 26px monospace'
            ctx.fillText('!', p.core.x - 7, p.core.y - p.radius.y - 16)
          }
          ctx.restore()
        }
        // Occupants come directly from domain data; large groups remain three glyphs.
        if (creatures > 0) {
          ctx.save()
          const count = Math.min(creatures, 3)
          for (let i = 0; i < count; i++) {
            const bob = closed ? 0 : Math.sin(time * (fx.speed + 1) * 2 + i * 2) * 3
            const oblique = p.radius.x < 20 && !closed
            const x = p.core.x + (oblique ? 0 : (i - (count - 1) / 2) * 17)
            const y =
              p.core.y + (closed ? p.radius.y + 24 : 18) + bob - (oblique ? i * 18 : 0)
            ctx.globalAlpha = closed
              ? 0.6
              : 0.75 + Math.sin(time * fx.speed * 3 + i) * 0.2
            creature(ctx, x, y, closed ? '#b89c81' : '#e4ddff')
          }
          if (creatures > 3) {
            ctx.globalAlpha = 1
            ctx.font = 'bold 14px monospace'
            ctx.fillStyle = '#fff2d8'
            ctx.fillText('×' + creatures, p.core.x - 9, p.core.y + p.radius.y + 32)
          }
          ctx.restore()
        }
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
        const flame = Math.floor((time * 7 + i) % 3)
        ctx.globalAlpha = 0.65
        ctx.fillStyle = '#ff9f43'
        ctx.fillRect(p.x - 3, p.y - 7 - flame * 2, 6, 10 + flame * 2)
        ctx.fillStyle = '#ffe4a0'
        ctx.fillRect(p.x - 1, p.y - 6, 3, 8)
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
  }, [portals, nearby, lastAction])
  return (
    <canvas
      className="scene-effects"
      ref={ref}
      width={SCENE.width / 2}
      height={Math.ceil(SCENE.height / 2)}
      aria-hidden="true"
    />
  )
}

function pixelRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  ctx.fillStyle = color
  for (let i = 0; i < 44; i++) {
    const angle = (i / 44) * Math.PI * 2
    ctx.fillRect(
      Math.round((x + Math.cos(angle) * rx) / 4) * 4,
      Math.round((y + Math.sin(angle) * ry) / 4) * 4,
      4,
      4,
    )
  }
}
function creature(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x - 4, y - 7, 8, 3)
  ctx.fillRect(x - 6, y - 4, 12, 10)
  ctx.fillRect(x - 6, y + 6, 3, 3)
  ctx.fillRect(x + 3, y + 6, 3, 3)
  ctx.fillStyle = '#202335'
  ctx.fillRect(x - 3, y - 2, 2, 3)
  ctx.fillRect(x + 2, y - 2, 2, 3)
}
