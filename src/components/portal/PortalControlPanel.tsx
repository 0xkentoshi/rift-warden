import { useEffect, useMemo, useRef, useState } from 'react'

import { calculateRisk } from '../../domain/risk/calculateRisk'
import {
  validateAction,
  type ActionReasonCode,
  type PortalAction,
} from '../../domain/validation/validateAction'
import {
  actionLabel,
  actionReason,
  riskFactorLabel,
  riskLevelLabel,
  t,
  type Language,
} from '../../i18n/translations'
import type { Portal } from '../../types/portal'
import type { AuditEvent } from '../../types/audit'
import { recommendAction } from '../../domain/report/recommendation'

interface PortalControlPanelProps {
  portal: Portal
  events: AuditEvent[]
  language: Language
  onClose: () => void
  onAction: (action: PortalAction) => void
  onRejectedAction: (action: PortalAction, reasonCode: ActionReasonCode) => void
}

const ACTIONS: PortalAction[] = ['stabilize', 'observe', 'mark-uncertain', 'close']

export function PortalControlPanel({
  portal,
  events,
  language,
  onClose,
  onAction,
  onRejectedAction,
}: PortalControlPanelProps) {
  const risk = calculateRisk(portal)
  const ru = language === 'ru'
  const recommendations = {
    closed: ru
      ? 'Портал закрыт. Дополнительные действия не нужны.'
      : 'Portal closed. No further action is needed.',
    stabilize: ru
      ? 'Стабилизируйте портал: это повысит стабильность, снизит энергию и увеличит время до схлопывания.'
      : 'Stabilize the portal to raise stability, lower energy and extend the collapse window.',
    observe: ru
      ? 'Отправьте наблюдателя, чтобы проверить неопределённую или опасную телеметрию.'
      : 'Send an observer to inspect uncertain or elevated-risk telemetry.',
    monitor: ru
      ? 'Оставьте открытым. Активных угроз нет; при необходимости отправьте наблюдателя.'
      : 'Keep it open. No active threats; send an observer if needed.',
  }

  const [pendingAction, setPendingAction] = useState<PortalAction | null>(null)

  const [message, setMessage] = useState<string | null>(null)
  const [messageKind, setMessageKind] = useState<'success' | 'rejected'>('success')
  const feedbackRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (message || pendingAction)
      feedbackRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    if (pendingAction) feedbackRef.current?.querySelector('button')?.focus()
  }, [message, pendingAction])

  const validations = useMemo(
    () =>
      Object.fromEntries(
        ACTIONS.map((action) => [action, validateAction(portal, action)]),
      ) as Record<PortalAction, ReturnType<typeof validateAction>>,
    [portal],
  )

  const showRejectedMessage = (action: PortalAction, reasonCode: ActionReasonCode) => {
    setMessageKind('rejected')
    setMessage(actionReason(language, reasonCode, portal.creatures))
    onRejectedAction(action, reasonCode)
  }

  const handleAction = (action: PortalAction) => {
    const validation = validations[action]

    setMessage(null)
    setPendingAction(null)

    if (!validation.allowed) {
      if (validation.reasonCode) {
        showRejectedMessage(action, validation.reasonCode)
      }

      return
    }

    if (validation.requiresConfirmation) {
      setPendingAction(action)
      return
    }

    onAction(action)
    setMessageKind('success')
    setMessage(
      action === 'observe'
        ? t(language, 'observerTelemetry')
        : `${t(language, 'actionCompleted')}: ${actionLabel(language, action)}`,
    )
  }

  const confirmPendingAction = () => {
    if (!pendingAction) {
      return
    }
    const validation = validateAction(portal, pendingAction)
    if (!validation.allowed && validation.reasonCode) {
      showRejectedMessage(pendingAction, validation.reasonCode)
      setPendingAction(null)
      return
    }

    onAction(pendingAction)
    setMessageKind('success')
    setMessage(
      `${t(language, 'actionCompleted')}: ${actionLabel(language, pendingAction)}`,
    )
    setPendingAction(null)
  }

  const pendingReason =
    pendingAction && validations[pendingAction].reasonCode
      ? actionReason(
          language,
          validations[pendingAction].reasonCode as ActionReasonCode,
          portal.creatures,
        )
      : null

  return (
    <div className="panel-backdrop" role="presentation">
      <section
        className="portal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${portal.name} control panel`}
      >
        <div className="portal-panel__header">
          <div>
            <span className="portal-panel__eyebrow">
              {t(language, 'riftIdentification')}
            </span>

            <h2>{portal.name}</h2>

            <p>{portal.destination}</p>
          </div>

          <button
            type="button"
            className="portal-panel__close"
            onClick={onClose}
            aria-label={t(language, 'closePanel')}
          >
            ×
          </button>
        </div>

        <div className="portal-panel__content">
          <div className="recommendation">
            <strong>
              {ru ? 'РЕКОМЕНДАЦИЯ' : 'RECOMMENDATION'} ·{' '}
              {portal.status === 'closed' ? t(language, 'closed') : t(language, 'open')}
            </strong>
            <p>{recommendations[recommendAction(portal)]}</p>
          </div>
          <div className="portal-panel__metrics">
            <Metric
              label={t(language, 'energy')}
              value={`${portal.energy}%`}
              percentage={portal.energy}
            />

            <Metric
              label={t(language, 'stability')}
              value={`${portal.stability}%`}
              percentage={portal.stability}
            />

            <Metric
              label={t(language, 'collapse')}
              value={
                portal.status === 'closed'
                  ? '—'
                  : `${portal.collapseMinutes} ${t(language, 'minutes')}`
              }
            />

            <Metric label={t(language, 'creatures')} value={String(portal.creatures)} />
          </div>

          <div className={`risk-console risk-console--${risk.level.toLowerCase()}`}>
            <div className="risk-console__top">
              <div>
                <span>{t(language, 'riskAssessment')}</span>

                <strong>{riskLevelLabel(language, risk.level)}</strong>
              </div>

              <div className="risk-console__score">{risk.score}</div>
            </div>

            <div className="risk-console__bar">
              <span style={{ width: `${risk.score}%` }} />
            </div>

            <div className="risk-console__factors">
              {risk.factors.length > 0 ? (
                risk.factors.map((factor) => (
                  <div key={`${factor.code}-${factor.points}`}>
                    <span>{riskFactorLabel(language, factor.code)}</span>
                    <strong>+{factor.points}</strong>
                  </div>
                ))
              ) : (
                <p>{t(language, 'noRiskFactors')}</p>
              )}
            </div>
            <details className="risk-formula">
              <summary>{ru ? 'Как считается риск?' : 'How is risk calculated?'}</summary>
              <p>
                {ru
                  ? 'Сумма факторов, максимум 100. Стабильность ≤20/40/60: +35/25/10. Энергия ≥90/75/60: +25/15/5. До схлопывания ≤5/15/30 мин: +25/15/5. Существ ≥6: +15; 1–5: +8. Под вопросом: +10. В каждой группе берётся один порог. Закрытый портал: 0.'
                  : 'Sum of factors, capped at 100. Stability ≤20/40/60: +35/25/10. Energy ≥90/75/60: +25/15/5. Collapse ≤5/15/30 min: +25/15/5. Creatures ≥6: +15; 1–5: +8. Uncertain: +10. Only one threshold per group. Closed portals: 0.'}
              </p>
              <p>LOW 0–24 · MEDIUM 25–49 · HIGH 50–74 · CRITICAL 75–100</p>
            </details>
          </div>

          <div className="portal-panel__actions">
            {ACTIONS.map((action) => {
              const validation = validations[action]
              const isBlocked = !validation.allowed

              return (
                <button
                  key={action}
                  type="button"
                  className={[
                    'portal-action',
                    action === 'close' ? 'portal-action--danger' : '',
                    isBlocked ? 'portal-action--blocked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleAction(action)}
                  title={
                    validation.reasonCode
                      ? actionReason(language, validation.reasonCode, portal.creatures)
                      : undefined
                  }
                >
                  <span>{actionLabel(language, action)}</span>

                  <small>
                    {isBlocked && validation.reasonCode
                      ? actionReason(language, validation.reasonCode, portal.creatures)
                      : validation.requiresConfirmation
                        ? t(language, 'warning')
                        : portal.status === 'closed'
                          ? t(language, 'offline')
                          : ru
                            ? 'ВЫПОЛНИТЬ'
                            : 'EXECUTE'}
                  </small>
                </button>
              )
            })}
          </div>

          {portal.uncertain && portal.status === 'open' && (
            <div className="portal-panel__notice">{t(language, 'unknownTelemetry')}</div>
          )}

          {message && (
            <div
              role="status"
              ref={feedbackRef}
              className={[
                'portal-panel__message',
                messageKind === 'rejected' ? 'portal-panel__message--rejected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <strong>
                {messageKind === 'rejected'
                  ? t(language, 'actionRejected')
                  : t(language, 'actionCompleted')}
              </strong>

              <span>{message}</span>
            </div>
          )}

          {pendingAction && pendingReason && (
            <div className="confirmation-box" role="alert" ref={feedbackRef}>
              <strong>{t(language, 'warning')}</strong>

              <p>{pendingReason}</p>

              <div>
                <button type="button" onClick={() => setPendingAction(null)}>
                  {t(language, 'cancel')}
                </button>

                <button
                  type="button"
                  className="confirmation-box__danger"
                  onClick={confirmPendingAction}
                >
                  {t(language, 'forceClose')}
                </button>
              </div>
            </div>
          )}
          <section className="portal-history">
            <h3>{ru ? 'История этого портала' : 'Portal history'}</h3>
            {events.length === 0 ? (
              <p className="subtle-copy">{t(language, 'noEvents')}</p>
            ) : (
              <ol>
                {[...events].reverse().map((event) => (
                  <li key={event.id}>
                    <time dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleString(ru ? 'ru-RU' : 'en-GB')}
                    </time>
                    <strong>{actionLabel(language, event.action)}</strong>
                    <span>
                      {event.status === 'rejected'
                        ? t(language, 'statusRejected')
                        : t(language, 'statusSuccess')}{' '}
                      · {event.beforeRisk} → {event.afterRisk}
                    </span>
                    {event.reasonCode && (
                      <small>
                        {actionReason(language, event.reasonCode, event.creatureCount)}
                      </small>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

interface MetricProps {
  label: string
  value: string
  percentage?: number
}

function Metric({ label, value, percentage }: MetricProps) {
  return (
    <div className="metric">
      <div className="metric__heading">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      {percentage !== undefined && (
        <div className="metric__bar">
          <span
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
