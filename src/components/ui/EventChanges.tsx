import type { AuditEvent } from '../../types/audit'
import {
  actionReason,
  acknowledgedWarning,
  riskLevelLabel,
  type Language,
} from '../../i18n/translations'
import { getRiskLevel } from '../../domain/risk/calculateRisk'
import { bi } from '../../i18n/gameplay'
export function EventChanges({
  event: e,
  language: l,
}: {
  event: AuditEvent
  language: Language
}) {
  return (
    <div className="event-changes">
      {e.reasonCode && (
        <p>
          {e.status === 'success' && e.reasonCode === 'creaturesInside'
            ? acknowledgedWarning(l, e.creatureCount)
            : actionReason(l, e.reasonCode, e.creatureCount)}
        </p>
      )}
      {e.closure && (
        <strong>
          {e.closure === 'safe'
            ? bi(l, 'БЕЗОПАСНОЕ ЗАКРЫТИЕ', 'SAFE CLOSE')
            : bi(
                l,
                'ПРИНУДИТЕЛЬНОЕ ЗАКРЫТИЕ · предупреждение подтверждено',
                'FORCE CLOSE · warning acknowledged',
              )}
        </strong>
      )}
      {e.status === 'rejected' ? (
        <span>
          {bi(l, 'Текущий риск', 'Current risk')}: {e.beforeRisk} ·{' '}
          {riskLevelLabel(l, getRiskLevel(e.beforeRisk))}
        </span>
      ) : (
        <>
          {e.beforeRisk !== e.afterRisk && (
            <span>
              {bi(l, 'Риск', 'Risk')}: {e.beforeRisk} → {e.afterRisk}
            </span>
          )}
          {e.beforeIntel !== undefined &&
            e.afterIntel !== undefined &&
            e.beforeIntel !== e.afterIntel && (
              <span>
                Intel: {e.beforeIntel}% → {e.afterIntel}%
              </span>
            )}
          {e.beforeEnergy !== undefined &&
            e.afterEnergy !== undefined &&
            e.beforeEnergy !== e.afterEnergy && (
              <span>
                {bi(l, 'Энергия', 'Energy')}: {e.beforeEnergy}% → {e.afterEnergy}%
              </span>
            )}
        </>
      )}
      {e.action === 'observer-returned' && (
        <span>
          {bi(l, 'Данные получены', 'Findings received')} · Intel {e.afterIntel}%
        </span>
      )}
      {e.category === 'system' && e.resonance !== undefined && (
        <span>
          {bi(l, 'Резонанс при событии', 'Resonance at event')}: {e.resonance}%
        </span>
      )}
    </div>
  )
}
