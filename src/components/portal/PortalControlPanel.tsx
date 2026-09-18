import { useEffect, useMemo, useRef, useState } from 'react'

import { calculateRisk } from '../../domain/risk/calculateRisk'
import { validateAction, type PortalAction } from '../../domain/validation/validateAction'
import {
  actionLabel,
  acknowledgedWarning,
  actionReason,
  riskFactorLabel,
  riskLevelLabel,
  t,
  type Language,
} from '../../i18n/translations'
import type { Portal } from '../../types/portal'
import type { AuditEvent } from '../../types/audit'
import { recommendAction } from '../../domain/report/recommendation'
import { applyAction, type ActionResult } from '../../domain/actions/applyAction'
import { AnimatedRisk } from './AnimatedRisk'

interface PortalControlPanelProps {
  portal: Portal
  events: AuditEvent[]
  language: Language
  onClose: () => void
  onAction: (action: PortalAction, confirmed?: boolean) => ActionResult
  onLanguageChange: (language: Language) => void
}

const ACTIONS: PortalAction[] = ['stabilize', 'observe', 'mark-uncertain', 'close']

export function PortalControlPanel({
  portal,
  events,
  language,
  onClose,
  onAction,
  onLanguageChange,
}: PortalControlPanelProps) {
  const risk = calculateRisk(portal)
  const ru = language === 'ru'
  const recommendations = {
    close: ru
      ? 'Окно до схлопывания истекло. Закройте разлом, учтя существ внутри. Это телеметрия, не таймер реального времени.'
      : 'The collapse window has expired. Secure the rift by closing it, accounting for occupants. This is telemetry, not a live countdown.',
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

  const [feedback, setFeedback] = useState<AuditEvent | 'error' | 'busy' | null>(null)
  const [busy, setBusy] = useState<PortalAction | null>(null)
  const executionLatch = useRef(false)
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const previewSnapshot = useRef<Portal | null>(null)
  const messageKind =
    typeof feedback === 'object' && feedback?.status === 'success'
      ? 'success'
      : 'rejected'
  const message =
    feedback === 'error'
      ? ru
        ? 'Действие не выполнено. Попробуйте снова; если ошибка повторится, перезагрузите страницу.'
        : 'The action could not be completed. Try again; reload if the problem persists.'
      : feedback === 'busy'
        ? ru
          ? 'Дождитесь завершения текущего действия.'
          : 'Wait for the current action to finish.'
        : feedback
          ? feedback.status === 'rejected' && feedback.reasonCode
            ? actionReason(language, feedback.reasonCode, feedback.creatureCount)
            : feedback.action === 'observe'
              ? t(language, 'observerTelemetry')
              : `${actionLabel(language, feedback.action)} · ${feedback.beforeRisk} → ${feedback.afterRisk}`
          : null
  useEffect(() => () => clearTimeout(unlockTimer.current), [])
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

  const execute = (action: PortalAction, confirmed = false) => {
    if (executionLatch.current) return
    executionLatch.current = true
    setBusy(action)
    setPendingAction(null)
    try {
      const result = onAction(action, confirmed)
      if ('event' in result) setFeedback(result.event)
      else if (result.kind === 'confirmation') setPendingAction(action)
      else setFeedback('busy')
    } catch (error) {
      console.error('Portal action failed', error)
      setFeedback('error')
    }
    unlockTimer.current = setTimeout(() => {
      executionLatch.current = false
      setBusy(null)
    }, 700)
  }
  const handleAction = (action: PortalAction) => {
    if (executionLatch.current) return
    setFeedback(null)
    if (!validations[action].allowed) {
      execute(action)
      return
    }
    previewSnapshot.current = portal
    setPendingAction(action)
  }
  const confirmPendingAction = () => {
    if (!pendingAction || executionLatch.current) return
    if (previewSnapshot.current !== portal) {
      setPendingAction(null)
      setFeedback('error')
      return
    }
    execute(pendingAction, true)
  }
  const preview = pendingAction ? applyAction(portal, pendingAction) : null
  const previewRisk = preview ? calculateRisk(preview) : null
  const pendingReason =
    pendingAction && validations[pendingAction].reasonCode
      ? actionReason(language, validations[pendingAction].reasonCode!, portal.creatures)
      : null

  return (
    <div className="panel-backdrop portal-backdrop" role="presentation">
      <section
        className="portal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${portal.name} control panel`}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && pendingAction) {
            event.preventDefault()
            event.stopPropagation()
            setPendingAction(null)
          }
        }}
      >
        <div className="portal-panel__header">
          <div>
            <span className="portal-panel__eyebrow">
              {t(language, 'riftIdentification')}
            </span>

            <h2>{portal.name}</h2>

            <p>{portal.destination}</p>
          </div>

          <div className="panel-tools">
            <button
              className="panel-language"
              onClick={() => onLanguageChange(ru ? 'en' : 'ru')}
              aria-label={ru ? 'Switch to English' : 'Переключить на русский'}
            >
              {ru ? 'EN' : 'RU'}
            </button>
            <button
              type="button"
              className="portal-panel__close"
              onClick={onClose}
              aria-label={t(language, 'closePanel')}
            >
              ×
            </button>
          </div>
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
                  : portal.collapseMinutes <= 0
                    ? ru
                      ? 'ОКНО ИСТЕКЛО'
                      : 'WINDOW EXPIRED'
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

              <AnimatedRisk score={risk.score} />
            </div>

            <div className="risk-console__bar">
              <span style={{ width: `${risk.score}%` }} />
            </div>

            <details className="risk-formula">
              <summary>{ru ? 'Как считается риск?' : 'How is risk calculated?'}</summary>
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
                  disabled={busy !== null}
                  aria-disabled={isBlocked || busy !== null}
                  aria-busy={busy === action}
                  title={
                    validation.reasonCode
                      ? actionReason(language, validation.reasonCode, portal.creatures)
                      : undefined
                  }
                >
                  <span>
                    {busy === action
                      ? ru
                        ? 'ВЫПОЛНЕНИЕ…'
                        : 'EXECUTING…'
                      : actionLabel(language, action)}
                  </span>

                  <small>
                    {isBlocked && validation.reasonCode
                      ? actionReason(language, validation.reasonCode, portal.creatures)
                      : validation.requiresConfirmation
                        ? t(language, 'warning')
                        : portal.status === 'closed'
                          ? t(language, 'offline')
                          : ru
                            ? 'ПРЕДПРОСМОТР →'
                            : 'PREVIEW →'}
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

          {pendingAction && preview && previewRisk && (
            <div
              className="confirmation-box action-preview"
              role={pendingReason ? 'alert' : 'region'}
              aria-label={ru ? 'Предпросмотр действия' : 'Action preview'}
              ref={feedbackRef}
            >
              <strong>
                {actionLabel(language, pendingAction)} · {ru ? 'ПРЕДПРОСМОТР' : 'PREVIEW'}
              </strong>
              {pendingReason && <p className="preview-warning">{pendingReason}</p>}
              <dl className="preview-grid">
                <div>
                  <dt>{t(language, 'riskAssessment')}</dt>
                  <dd>
                    {risk.score} {riskLevelLabel(language, risk.level)} →{' '}
                    <b>
                      {previewRisk.score} {riskLevelLabel(language, previewRisk.level)}
                    </b>
                  </dd>
                </div>
                <div>
                  <dt>{t(language, 'stability')}</dt>
                  <dd>
                    {portal.stability}% → <b>{preview.stability}%</b>
                  </dd>
                </div>
                <div>
                  <dt>{t(language, 'energy')}</dt>
                  <dd>
                    {portal.energy}% → <b>{preview.energy}%</b>
                  </dd>
                </div>
                <div>
                  <dt>{t(language, 'collapse')}</dt>
                  <dd>
                    {portal.collapseMinutes} →{' '}
                    <b>
                      {preview.status === 'closed' ? '—' : preview.collapseMinutes}{' '}
                      {t(language, 'minutes')}
                    </b>
                  </dd>
                </div>
              </dl>
              <p className="subtle-copy">
                {pendingAction === 'observe'
                  ? ru
                    ? 'После подтверждения наблюдатель проверит портал. Показания останутся прежними; результат появится в журнале.'
                    : 'After confirmation, an observer will inspect the portal. Readings stay unchanged; the result is recorded in the journal.'
                  : ru
                    ? 'Это прогноз. Данные изменятся только после подтверждения.'
                    : 'This is a preview. Data changes only after confirmation.'}
              </p>

              <div>
                <button type="button" onClick={() => setPendingAction(null)}>
                  {t(language, 'cancel')}
                </button>

                <button
                  type="button"
                  className="confirmation-box__danger"
                  onClick={confirmPendingAction}
                >
                  {pendingAction === 'close' && portal.creatures > 0
                    ? t(language, 'forceClose')
                    : ru
                      ? 'ПОДТВЕРДИТЬ'
                      : 'CONFIRM'}
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
                  <li
                    key={event.id}
                    className={
                      typeof feedback === 'object' && feedback?.id === event.id
                        ? 'event-new'
                        : ''
                    }
                  >
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
                        {event.status === 'success' &&
                        event.reasonCode === 'creaturesInside'
                          ? acknowledgedWarning(language, event.creatureCount)
                          : actionReason(language, event.reasonCode, event.creatureCount)}
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
