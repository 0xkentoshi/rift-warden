import { portalPositions } from '../../data/labLayout'
import { calculateRisk } from '../../domain/risk/calculateRisk'
import { t, riskLevelLabel, type Language } from '../../i18n/translations'
import type { Portal } from '../../types/portal'

interface Props {
  portal: Portal
  nearby: boolean
  language: Language
  onOpen: () => void
}
export function PortalEntity({ portal, nearby, language, onOpen }: Props) {
  const p = portalPositions[portal.id]
  const risk = calculateRisk(portal)
  if (!p) return null
  return (
    <>
      <button
        className={'portal-hotspot' + (nearby ? ' is-nearby' : '')}
        style={{
          left: p.collider.x,
          top: p.collider.y,
          width: p.collider.width,
          height: p.collider.height,
        }}
        aria-label={t(language, 'inspect') + ' ' + portal.name}
        onClick={onOpen}
      />
      {nearby && (
        <button
          className={
            'portal-label risk-' +
            risk.level.toLowerCase() +
            (portal.status === 'closed' ? ' is-closed' : '') +
            (nearby ? ' is-nearby' : '')
          }
          style={{ left: p.label.x, top: p.label.y }}
          onClick={onOpen}
        >
          <strong>{portal.name}</strong>
          <small>
            {t(language, 'stability')}: {portal.stability}% · {t(language, 'creatures')}:{' '}
            {portal.creatures}
          </small>
          <span>
            {portal.status === 'closed'
              ? t(language, 'offline')
              : riskLevelLabel(language, risk.level) + ' · ' + risk.score}
          </span>
          <small>
            <kbd>E</kbd> {t(language, 'inspect')}
          </small>
        </button>
      )}
    </>
  )
}
