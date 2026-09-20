import { useEffect, useRef, useState, type ReactNode } from 'react'
import { colliders, portalPositions, SCENE, walkableZones } from '../../data/labLayout'
import { isInteractionCode } from '../../domain/input/keyboard'
import { nearestPortal, viewportTransform } from '../../game/geometry'
import { useKeyboardMovement } from '../../hooks/useKeyboardMovement'
import { t, riskLevelLabel, type Language } from '../../i18n/translations'
import { effectiveRisk } from '../../domain/simulation/network'
import { statusLabel } from '../../i18n/gameplay'
import type { Portal } from '../../types/portal'
import { Character } from './Character'
import { PortalEntity } from './PortalEntity'
import { SceneEffects } from './SceneEffects'
import type { AuditEvent } from '../../types/audit'
import { readPreference, writePreference } from '../../storage/labStorage'

interface Props {
  timeScale?: number
  portals: Portal[]
  movementLocked?: boolean
  onNearbyChange?: (id: string | null) => void
  interactionLocked: boolean
  language: Language
  onSelectPortal: (id: string) => void
  children: ReactNode
  lastAction?: AuditEvent | null
}
export function Laboratory({
  portals,
  timeScale = 1,
  interactionLocked,
  movementLocked = interactionLocked,
  onNearbyChange,
  language,
  onSelectPortal,
  children,
  lastAction = null,
}: Props) {
  const [showHint, setShowHint] = useState(
    () => readPreference('rift-warden-controls-seen') !== 'yes',
  )
  const interactionLatch = useRef(0)
  const inspect = (id: string) => {
    if (interactionLocked || performance.now() < interactionLatch.current) return
    interactionLatch.current = performance.now() + 300
    setShowHint(false)
    writePreference('rift-warden-controls-seen', 'yes')
    onSelectPortal(id)
  }
  const viewport = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState(() =>
    viewportTransform(window.innerWidth, window.innerHeight),
  )
  const movement = useKeyboardMovement(!movementLocked, timeScale)
  const nearby = nearestPortal(
    movement.position,
    portals.map((p) => p.id),
  )
  useEffect(() => {
    onNearbyChange?.(nearby)
  }, [nearby, onNearbyChange])
  const debug = new URLSearchParams(window.location.search).has('debug')
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const resize = new ResizeObserver(([entry]) =>
      setTransform(viewportTransform(entry.contentRect.width, entry.contentRect.height)),
    )
    resize.observe(element)
    return () => resize.disconnect()
  }, [])
  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (
        !isInteractionCode(event.code) ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        interactionLocked ||
        !nearby
      )
        return
      if (
        event.target instanceof HTMLElement &&
        (event.target.matches('input, textarea, select') ||
          event.target.isContentEditable)
      )
        return
      event.preventDefault()
      inspect(nearby)
    }
    window.addEventListener('keydown', interact)
    return () => window.removeEventListener('keydown', interact)
  })
  return (
    <main
      className="laboratory"
      tabIndex={-1}
      onPointerDown={(event) => {
        if (
          event.target === event.currentTarget ||
          !(event.target as Element).closest(
            'button, select, input, textarea, a, summary, [role="button"], [contenteditable="true"]',
          )
        )
          event.currentTarget.focus()
      }}
      ref={viewport}
      inert={interactionLocked}
      aria-label={language === 'ru' ? 'Лаборатория порталов' : 'Portal laboratory'}
    >
      <div
        className="laboratory__scene"
        style={{
          width: SCENE.width,
          height: SCENE.height,
          transform:
            'translate(' +
            transform.x +
            'px,' +
            transform.y +
            'px) scale(' +
            transform.scale +
            ')',
        }}
      >
        <SceneEffects portals={portals} nearby={nearby} lastAction={lastAction} />
        <div className="silent-arch-occlusion" aria-hidden="true" />
        {portals.map((portal) => (
          <PortalEntity
            key={portal.id}
            portal={portal}
            network={portals}
            nearby={nearby === portal.id}
            onInspect={() => inspect(portal.id)}
            language={language}
          />
        ))}
        <Character
          x={movement.position.x}
          y={movement.position.y}
          direction={movement.direction}
          moving={movement.moving}
        />
        {debug && (
          <svg
            className="collision-debug"
            width={SCENE.width}
            height={SCENE.height}
            aria-hidden="true"
          >
            {walkableZones.map((zone) =>
              zone.type === 'ellipse' ? (
                <ellipse
                  className="walkable-debug"
                  key={zone.id}
                  cx={zone.center.x}
                  cy={zone.center.y}
                  rx={zone.radius.x}
                  ry={zone.radius.y}
                />
              ) : (
                <line
                  className="walkable-debug"
                  key={zone.id}
                  x1={zone.from.x}
                  y1={zone.from.y}
                  x2={zone.to.x}
                  y2={zone.to.y}
                  strokeWidth={zone.width}
                />
              ),
            )}
            {colliders.map((c) => (
              <rect key={c.id} x={c.x} y={c.y} width={c.width} height={c.height} />
            ))}
            {Object.entries(portalPositions).map(([id, p]) => (
              <g key={id}>
                <circle cx={p.approach.x} cy={p.approach.y} r={p.interactionRadius} />
                <text x={p.approach.x} y={p.approach.y}>
                  {id}
                </text>
              </g>
            ))}
            <circle
              className="player-collider"
              cx={movement.position.x}
              cy={movement.position.y}
              r={11}
            />
          </svg>
        )}
      </div>
      {children}
      {showHint && portals.length > 0 && (
        <aside className="first-hint">
          <span className="first-hint__icon">✦</span>
          <div>
            <strong>
              {language === 'ru' ? 'ТВОЯ СМЕНА НАЧАЛАСЬ' : 'YOUR WATCH BEGINS'}
            </strong>
            <p>
              {language === 'ru'
                ? '6 порталов. Начни с зелёного: изучи разлом и удержи сеть.'
                : '6 portals. Start with green: research the rift and contain the network.'}
            </p>
            <small>
              <kbd>WASD / ↑↓←→</kbd> {t(language, 'move')} · <kbd>E</kbd>{' '}
              {t(language, 'inspect')}
              <br />
              {language === 'ru'
                ? 'Действия: подойди к порталу и нажми E. Реестр — мониторинг.'
                : 'Actions: approach a portal and press E. Registry is monitoring only.'}
            </small>
          </div>
        </aside>
      )}
      <section
        className="mobile-portals"
        aria-label={
          language === 'ru' ? 'Быстрый доступ к порталам' : 'Quick portal access'
        }
      >
        <p>
          {language === 'ru'
            ? 'Мониторинг. Для действий подойдите к порталу и нажмите E.'
            : 'Monitoring only. Approach a portal and press E to act.'}
        </p>
        <div>
          {portals.map((portal) => {
            const risk = effectiveRisk(portal, portals)
            return (
              <article className="mobile-portal" key={portal.id}>
                <strong>{portal.name}</strong>
                <small>{portal.destination}</small>
                <span className={'risk-text risk-text--' + risk.level.toLowerCase()}>
                  {portal.status !== 'open'
                    ? statusLabel(language, portal.status)
                    : riskLevelLabel(language, risk.level) + ' · ' + risk.score}
                </span>
              </article>
            )
          })}
        </div>
      </section>
      {portals.length === 0 && (
        <div className="laboratory-empty">
          <span>◇</span>
          <strong>{t(language, 'noActivePortals')}</strong>
          <p>{t(language, 'noActivePortalsHint')}</p>
        </div>
      )}
      <div className="scene-footer">
        <span className="scene-status">
          <i />
          {language === 'ru'
            ? 'ЛАБОРАТОРИЯ 06 · СМОТРИТЕЛЬ НА ПОСТУ'
            : 'LABORATORY 06 · WARDEN ON DUTY'}
        </span>
        {nearby && !interactionLocked ? (
          <span className="interaction-prompt">
            <kbd>E</kbd>
            {t(language, 'inspect')} {portals.find((p) => p.id === nearby)?.name}
          </span>
        ) : (
          <span className="controls-hint">
            <kbd>WASD / ↑↓←→</kbd> {t(language, 'move')} <kbd>E</kbd>{' '}
            {t(language, 'interact')} <span>· {t(language, 'clickInspect')}</span>
          </span>
        )}
      </div>
    </main>
  )
}
