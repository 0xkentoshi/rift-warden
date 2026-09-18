import { useEffect, useRef, useState, type ReactNode } from 'react'
import { colliders, portalPositions, SCENE } from '../../data/labLayout'
import { isInteractionCode } from '../../domain/input/keyboard'
import { nearestPortal, viewportTransform } from '../../game/geometry'
import { useKeyboardMovement } from '../../hooks/useKeyboardMovement'
import { t, riskLevelLabel, type Language } from '../../i18n/translations'
import { calculateRisk } from '../../domain/risk/calculateRisk'
import type { Portal } from '../../types/portal'
import { Character } from './Character'
import { PortalEntity } from './PortalEntity'
import { SceneEffects } from './SceneEffects'

interface Props {
  portals: Portal[]
  interactionLocked: boolean
  language: Language
  onSelectPortal: (id: string) => void
  children: ReactNode
}
export function Laboratory({
  portals,
  interactionLocked,
  language,
  onSelectPortal,
  children,
}: Props) {
  const viewport = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState(() =>
    viewportTransform(window.innerWidth, window.innerHeight),
  )
  const movement = useKeyboardMovement(!interactionLocked)
  const nearby = nearestPortal(
    movement.position,
    portals.map((p) => p.id),
  )
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
      if (!isInteractionCode(event.code) || event.repeat || interactionLocked || !nearby)
        return
      if (
        event.target instanceof HTMLElement &&
        event.target.matches('input, textarea, select')
      )
        return
      event.preventDefault()
      onSelectPortal(nearby)
    }
    window.addEventListener('keydown', interact)
    return () => window.removeEventListener('keydown', interact)
  }, [nearby, interactionLocked, onSelectPortal])
  return (
    <main
      className="laboratory"
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
        <SceneEffects portals={portals} />
        {portals.map((portal) => (
          <PortalEntity
            key={portal.id}
            portal={portal}
            nearby={nearby === portal.id}
            language={language}
            onOpen={() => onSelectPortal(portal.id)}
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
      <section
        className="mobile-portals"
        aria-label={
          language === 'ru' ? 'Быстрый доступ к порталам' : 'Quick portal access'
        }
      >
        <p>
          {language === 'ru'
            ? 'Выберите портал, чтобы оценить риск и принять решение.'
            : 'Select a portal to assess its risk and take action.'}
        </p>
        <div>
          {portals.map((portal) => {
            const risk = calculateRisk(portal)
            return (
              <button key={portal.id} onClick={() => onSelectPortal(portal.id)}>
                <strong>{portal.name}</strong>
                <small>{portal.destination}</small>
                <span className={'risk-text risk-text--' + risk.level.toLowerCase()}>
                  {portal.status === 'closed'
                    ? t(language, 'offline')
                    : riskLevelLabel(language, risk.level) + ' · ' + risk.score}
                </span>
              </button>
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
          <button className="interaction-prompt" onClick={() => onSelectPortal(nearby)}>
            <kbd>E</kbd>
            {t(language, 'inspect')} {portals.find((p) => p.id === nearby)?.name}
          </button>
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
