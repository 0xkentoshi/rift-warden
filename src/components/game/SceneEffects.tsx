import { useEffect, useRef } from 'react'
import { ambientLights, portalPositions, SCENE } from '../../data/labLayout'
import { effectiveRisk } from '../../domain/simulation/network'
import { getRiskLevel } from '../../domain/risk/calculateRisk'
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
  const proximity = useRef({ id: nearby, since: 0 })
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.setTransform(0.5, 0, 0, 0.5, 0, 0)
    ctx.imageSmoothingEnabled = false
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (proximity.current.id !== nearby)
      proximity.current = { id: nearby, since: performance.now() }
    const states = Object.entries(portalPositions).map(([id, placement]) => {
      const portal = portals.find((p) => p.id === id)
      const risk = portal ? effectiveRisk(portal, portals) : null
      return {
        id,
        creatures: portal?.creatures ?? 0,
        placement,
        closed: !portal || portal.status === 'closed' || portal.status === 'collapsed',
        status: portal?.status ?? 'closed',
        remaining: portal?.collapseMinutes ?? 0,
        transitionMs: portal?.collapseTransitionMs ?? 0,
        color: risk?.level === 'CRITICAL' ? '#ff383c' : placement.color,
        fx: riskToVfx(
          portal && portal.collapseMinutes <= 0.5 ? 'CRITICAL' : (risk?.level ?? 'LOW'),
          portal?.status ?? 'closed',
        ),
      }
    })
    let frame = 0
    let lastPaint = -Infinity
    const draw = (now: number) => {
      // One 30 fps pixel layer; movement remains on its existing independent RAF.
      if (!motion.matches && !document.hidden && now - lastPaint < 32) {
        frame = requestAnimationFrame(draw)
        return
      }
      lastPaint = now
      const time = motion.matches ? 0 : now / 1000
      ctx.clearRect(0, 0, SCENE.width, SCENE.height)
      for (const [index, state] of states.entries()) {
        const { id, placement: p, creatures, closed, color, fx } = state
        const direction = index % 2 ? -1 : 1
        const wave = 0.65 + 0.35 * Math.sin(time * fx.pulse * 2 + index)
        const actionAge =
          lastAction?.portalId === id && lastAction.status === 'success'
            ? (Date.now() - Date.parse(lastAction.timestamp)) / 1000
            : Infinity
        const actionActive = actionAge >= 0 && actionAge < 2.4 && !motion.matches
        const closing = actionActive && lastAction?.action === 'close'
        const jitter = motion.matches
          ? 0
          : fx.shake * Math.sin(time * 37 + index) * Math.sin(time * 19)
        const boost = id === nearby ? 1.32 : 1
        // The closed core is genuinely dim; baked scene art contains no moving portal interiors.
        ctx.save()
        // Distort the field inside its fixed aperture, never shift the approved masonry.
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
        glow.addColorStop(0.86, color + (closed ? '00' : '50'))
        glow.addColorStop(1, color + (closed ? '00' : 'ef'))
        ctx.fillStyle = glow
        ctx.fillRect(-2, -2, 4, 4)
        ctx.lineWidth = 0.025
        for (let ring = 0; ring < (closed ? 0 : 5); ring++) {
          const radius = 0.18 + ((ring / 5 + time * fx.speed * 0.23) % 1) * 0.83
          ctx.globalAlpha = 0.55 * (1 - radius * 0.6)
          ctx.strokeStyle = color
          const angle = time * fx.speed * direction + ring * 1.9
          ctx.beginPath()
          ctx.ellipse(
            Math.sin(time + ring) * 0.06 + jitter / p.radius.x,
            (jitter * 0.5) / p.radius.y,
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
        ctx.globalAlpha = Math.min(1, fx.glow * boost * (0.48 + wave * 0.52))
        const spill = ctx.createRadialGradient(
          p.core.x,
          p.core.y,
          15,
          p.core.x,
          p.core.y,
          155,
        )
        spill.addColorStop(0, color + '48')
        spill.addColorStop(0.38, color + '65')
        spill.addColorStop(0.65, color + '20')
        spill.addColorStop(1, color + '00')
        ctx.fillStyle = spill
        ctx.fillRect(p.core.x - 155, p.core.y - 155, 310, 310)
        ctx.save()
        ctx.translate(p.core.x, p.core.y + p.radius.y + 30)
        ctx.scale(1, 0.25)
        const ground = ctx.createRadialGradient(0, 0, 0, 0, 0, 120)
        ground.addColorStop(0, color + 'cf')
        ground.addColorStop(1, color + '00')
        ctx.fillStyle = ground
        ctx.fillRect(-120, -120, 240, 240)
        ctx.restore()
        const particleCount = Math.ceil(fx.particles * (id === nearby ? 1.2 : 1))
        for (let i = 0; i < particleCount; i++) {
          const phase = (i * 0.618034 + time * fx.speed * 0.17) % 1
          const angle = i * 2.39996 + time * fx.orbit * direction
          const turbulence = fx.turbulence * Math.sin(time * 2.8 + i * 9.2)
          // Mixed orbits, rising embers and floor sparks avoid a uniform particle curtain.
          const orbiting = i % 3 === 0
          const radius = p.radius.x + 15 + (i % 7) * 11 + turbulence * 20
          let x = p.core.x + Math.cos(angle) * radius
          let y = orbiting
            ? p.core.y + Math.sin(angle) * (p.radius.y + 18 + (i % 5) * 11)
            : p.core.y + 105 - phase * 230 + Math.sin(angle * 1.5) * 20
          x += turbulence * 14
          if (fx.turbulence >= 0.6 && i % 7 === 0) {
            const along = phase * 0.9
            x = p.approach.x + (836 - p.approach.x) * along + Math.sin(i * 7) * 17
            y =
              p.approach.y + (502 - p.approach.y) * along - Math.sin(phase * Math.PI) * 8
          }
          const alpha =
            (0.25 + Math.sin(phase * Math.PI) * 0.75) * (i % 4 === 0 ? 0.95 : 0.62)
          ctx.globalAlpha = alpha
          ctx.fillStyle = i % 9 === 0 ? '#fff2ce' : color
          const size = i % 6 === 0 ? 4 : 2
          const px = Math.round(x / 2) * 2,
            py = Math.round(y / 2) * 2
          ctx.fillRect(px, py, size, size)
          if (i % 11 === 0 && Math.sin(time * 2 + i) > 0.5) {
            ctx.fillRect(px - 4, py, 10, 2)
            ctx.fillRect(px, py - 4, 2, 10)
          }
          if (fx.turbulence >= 0.6 && i % 4 === 0) {
            ctx.globalAlpha = alpha * 0.25
            ctx.fillRect(px - Math.round(Math.sin(angle) * 5) * 2, py + 6, 4, 4)
          }
        }
        // Shimmer is anchored to the existing rim, with no new facade or silhouette.
        if (!closed) {
          for (let i = 0; i < 26; i++) {
            const angle = (i / 26) * Math.PI * 2
            const shimmer = Math.max(0, Math.sin(time * (0.9 + fx.speed) + i * 1.8))
            ctx.globalAlpha = shimmer * 0.7 * fx.glow
            ctx.fillStyle = i % 4 === 0 ? '#fff4d0' : color
            ctx.fillRect(
              Math.round((p.core.x + Math.cos(angle) * p.radius.x * 1.14) / 2) * 2,
              Math.round((p.core.y + Math.sin(angle) * p.radius.y * 1.13) / 2) * 2,
              4,
              4,
            )
          }
        }
        ctx.restore()
        const proximityAge = (now - proximity.current.since) / 1000
        if (!closed && id === nearby && proximityAge < 0.9 && !motion.matches) {
          ctx.save()
          ctx.globalAlpha = (1 - proximityAge / 0.9) * 0.7
          pixelRing(
            ctx,
            p.core.x,
            p.core.y,
            p.radius.x + 8 + proximityAge * 28,
            p.radius.y + 8 + proximityAge * 28,
            '#fff0bf',
          )
          ctx.restore()
        }
        // Blocky local outbursts and stepped shockwaves, never camera shake.
        const burstPhase = (time + index * 0.43) % (4.2 - fx.shake * 0.45)
        if (!motion.matches && !closed && fx.burst > 0 && burstPhase < 0.65) {
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
          if (fx.turbulence >= 1)
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
          } else if (lastAction.action === 'mark-uncertain') {
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
        // Lifecycle overlays stay inside / immediately around the existing aperture.
        if (state.status === 'quarantined') {
          ctx.save()
          ctx.globalAlpha = 0.8
          ctx.fillStyle = '#a4c5b8'
          for (let i = -1; i <= 1; i++)
            ctx.fillRect(
              p.core.x + i * 12 - 2,
              p.core.y - p.radius.y * 0.7,
              4,
              p.radius.y * 1.4,
            )
          ctx.fillRect(p.core.x - p.radius.x * 0.7, p.core.y - 2, p.radius.x * 1.4, 4)
          ctx.restore()
        }
        if (state.status === 'collapsing') {
          const progress = 1 - state.transitionMs / 1500
          ctx.save()
          ctx.globalAlpha = 0.9
          pixelRing(
            ctx,
            p.core.x,
            p.core.y,
            35 + progress * 100,
            50 + progress * 75,
            '#ffc8ae',
          )
          ctx.fillStyle = '#ffe8d7'
          ctx.fillRect(p.core.x - 4, p.core.y - p.radius.y, 8, p.radius.y * 2)
          ctx.restore()
        }
        if (!closed && state.status !== 'collapsing' && state.remaining <= 3 / 60) {
          ctx.save()
          ctx.globalAlpha = motion.matches
            ? 0.6
            : 0.3 + 0.5 * Math.abs(Math.sin(time * 12))
          ctx.strokeStyle = '#ffe6bb'
          ctx.lineWidth = 4
          ctx.strokeRect(
            p.core.x - p.radius.x - 8,
            p.core.y - p.radius.y - 8,
            p.radius.x * 2 + 16,
            p.radius.y * 2 + 16,
          )
          ctx.restore()
        }
        if (!closed && state.status !== 'collapsing' && state.remaining <= 0.5) {
          ctx.save()
          ctx.globalAlpha = 1
          ctx.fillStyle = state.remaining <= 10 / 60 ? '#ff9b86' : '#f3d18b'
          ctx.font = 'bold 20px monospace'
          ctx.fillText(
            String(Math.ceil(state.remaining * 60)) + 's',
            p.core.x - 16,
            p.core.y - p.radius.y - 18,
          )
          ctx.restore()
        }
        if (state.status === 'collapsed') {
          ctx.save()
          ctx.globalAlpha = 0.6
          ctx.fillStyle = '#858491'
          for (let i = -2; i <= 2; i++) {
            ctx.fillRect(p.core.x + i * 5, p.core.y + i * 6, 5, 5)
            ctx.fillRect(p.core.x - i * 5, p.core.y + i * 6, 5, 5)
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
        const fireColor = p.color ?? '#ffb54e'
        const flicker =
          0.18 + (Math.sin(time * 4 + i) + Math.sin(time * 7 + i * 3)) * 0.035
        const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 56)
        glow.addColorStop(0, fireColor)
        glow.addColorStop(1, fireColor + '00')
        ctx.globalAlpha = flicker
        ctx.fillStyle = glow
        ctx.fillRect(p.x - 56, p.y - 56, 112, 112)
        const flame = Math.floor((time * 9 + i) % 4)
        ctx.globalAlpha = 0.8
        ctx.fillStyle = p.color ?? '#ff7636'
        ctx.fillRect(p.x - 4, p.y - 6, 8, 10)
        ctx.fillStyle = fireColor
        ctx.fillRect(p.x - 3 + (flame % 2) * 2, p.y - 8 - flame * 2, 4, 12 + flame * 2)
        ctx.fillStyle = '#ffe4a0'
        ctx.fillRect(p.x - 1, p.y - 6, 3, 8)
        for (let spark = 0; spark < 3; spark++) {
          const phase = (time * 0.32 + i * 0.31 + spark / 3) % 1
          ctx.globalAlpha = (1 - phase) * 0.55
          ctx.fillStyle = spark % 2 ? fireColor : '#ffe5a2'
          ctx.fillRect(p.x + Math.sin(time + i + spark) * 9, p.y - 13 - phase * 40, 2, 2)
        }
      })
      for (let i = 0; i < 110; i++) {
        const x = 110 + ((i * 97.7 + time * (3 + (i % 3))) % 1440)
        const y = 180 + ((i * 67.1 - time * 4 + 6000) % 650)
        ctx.globalAlpha = 0.14 + Math.sin(time * 0.8 + i) * 0.12
        ctx.fillStyle = i % 5 ? '#ffe6ac' : '#b7eed8'
        ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2)
        if (i % 17 === 0) {
          ctx.fillRect(Math.round(x / 2) * 2 - 2, Math.round(y / 2) * 2, 6, 2)
        }
      }
      ctx.restore()
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const restart = () => {
      cancelAnimationFrame(frame)
      lastPaint = -Infinity
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
