import { portalPositions } from '../../data/labLayout'
import { effectiveRisk } from '../../domain/simulation/network'
import { countdown, statusLabel } from '../../i18n/gameplay'
import { t, riskLevelLabel, type Language } from '../../i18n/translations'
import type { Portal } from '../../types/portal'

interface Props {
  onInspect: () => void
  portal: Portal
  network?: Portal[]
  nearby: boolean
  language: Language
}
export function PortalEntity({
  portal,
  network = [portal],
  nearby,
  language,
  onInspect,
}: Props) {
  const p = portalPositions[portal.id]
  const risk = effectiveRisk(portal, network)
  if (!p) return null
  return (
    <>
      <button
        type="button"
        onClick={onInspect}
        className={'portal-hotspot' + (nearby ? ' is-nearby' : '')}
        style={{
          left: p.collider.x,
          top: p.collider.y,
          width: p.collider.width,
          height: p.collider.height,
        }}
        aria-label={portal.name}
      />
      {nearby && (
        <div
          className={
            'portal-label risk-' +
            risk.level.toLowerCase() +
            (portal.status === 'closed' ? ' is-closed' : '') +
            (nearby ? ' is-nearby' : '')
          }
          style={{ left: p.label.x, top: p.label.y }}
        >
          <strong>{portal.name}</strong>
          <small>
            {t(language, 'stability')}: {portal.stability.toFixed(1)}% ·{' '}
            {t(language, 'creatures')}: {portal.creatures}
          </small>
          <span>
            {portal.status !== 'open'
              ? statusLabel(language, portal.status)
              : riskLevelLabel(language, risk.level) + ' · ' + risk.score}
          </span>
          <small>
            Intel {portal.intel}% · {countdown(portal)}
          </small>
          <small>
            <kbd>E</kbd> {t(language, 'inspect')}
          </small>
        </div>
      )}
    </>
  )
}
