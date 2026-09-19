import { useEffect, useRef, useState } from 'react'

import { effectiveRisk, labResonance } from '../../domain/simulation/network'
import { bi, countdown, statusLabel, findings } from '../../i18n/gameplay'
import { EventChanges } from '../ui/EventChanges'
import { ActionPreviewDetails } from './ActionPreviewDetails'
import { validateAction, type PortalAction } from '../../domain/validation/validateAction'
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
import {
  applyAction,
  closureKind,
  type ActionResult,
} from '../../domain/actions/applyAction'
import { AnimatedRisk } from './AnimatedRisk'

interface PortalControlPanelProps {
  canInteract?: boolean
  portal: Portal
  network: Portal[]
  events: AuditEvent[]
  language: Language
  onClose: () => void
  onAction: (action: PortalAction, confirmed?: boolean) => ActionResult
  onLanguageChange: (language: Language) => void
}

export function PortalControlPanel({
  portal,
  canInteract = false,
  network,
  events,
  language,
  onClose,
  onAction,
  onLanguageChange,
}: PortalControlPanelProps) {
  const risk = effectiveRisk(portal, network)
  const ACTIONS: PortalAction[] = [
    'stabilize',
    'observe',
    'mark-uncertain',
    portal.status === 'quarantined' ? 'reactivate' : 'quarantine',
    'close',
  ]
  const ru = language === 'ru'
  const recommendations = {
    close: bi(
      language,
      'Закройте портал. Если он не изучен или внутри есть существа, потребуется предупреждение о принудительном закрытии.',
      'Close the portal. Unresearched or occupied rifts require a force-close warning.',
    ),
    closed: bi(
      language,
      'Портал закрыт. Дополнительные действия не нужны.',
      'Portal closed. No further action is needed.',
    ),
    lost: bi(
      language,
      'Контроль потерян. Следите за остальной сетью и журналом инцидентов.',
      'Containment lost. Check the remaining network and incident log.',
    ),
    stabilize: bi(
      language,
      'Стабилизируйте: +30 стабильности, −15 энергии, +15 минут. Снижение вклада разгрузит сеть.',
      'Stabilize: +30 stability, −15 energy, +15 minutes. Lower contribution relieves the network.',
    ),
    observe: bi(
      language,
      'Отправьте наблюдателя: Intel растёт вместе с энергией. Проверьте цену и риск в предпросмотре.',
      'Send an observer: Intel rises together with energy. Check the cost and risk in the preview.',
    ),
    quarantine: bi(
      language,
      'Изолируйте угрозу: меньше давления на сеть и медленнее таймер. Исследование временно недоступно.',
      'Isolate the threat: lower network pressure and a slower timer. Research is temporarily unavailable.',
    ),
    reactivate: bi(
      language,
      'Снимите изоляцию для продолжения исследования. Активация повышает энергию.',
      'Reactivate to continue research. Activation raises energy.',
    ),
    'mark-uncertain': bi(
      language,
      'Пометьте показания для дополнительной проверки.',
      'Flag these readings for further verification.',
    ),
    monitor: bi(
      language,
      'Сейчас вмешательство недоступно. Проверьте причины ограничений ниже.',
      'Intervention is unavailable now. Check the restrictions below.',
    ),
  }

  const [pendingAction, setPendingAction] = useState<PortalAction | null>(null)

  const [feedback, setFeedback] = useState<AuditEvent | 'error' | 'busy' | null>(null)
  const [busy, setBusy] = useState<PortalAction | null>(null)
  const executionLatch = useRef(false)
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
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
              : actionLabel(language, feedback.action) +
                (feedback.beforeRisk !== feedback.afterRisk
                  ? ` · ${feedback.beforeRisk} → ${feedback.afterRisk}`
                  : '')
          : null
  useEffect(() => () => clearTimeout(unlockTimer.current), [])
  const feedbackRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (message || pendingAction)
      feedbackRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    if (pendingAction) feedbackRef.current?.querySelector('button')?.focus()
  }, [message, pendingAction])

  const validations = Object.fromEntries(
    ACTIONS.map((action) => [action, validateAction(portal, action, network)]),
  ) as Record<PortalAction, ReturnType<typeof validateAction>>

  const execute = (action: PortalAction, confirmed = false) => {
    if (!canInteract || executionLatch.current) return
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
    setPendingAction(action)
  }
  const confirmPendingAction = () => {
    if (!canInteract || !pendingAction || executionLatch.current) return
    execute(pendingAction, true)
  }
  const preview = pendingAction ? applyAction(portal, pendingAction, network) : null
  const previewRisk = preview
    ? effectiveRisk(
        preview,
        network.map((p) => (p.id === preview.id ? preview : p)),
      )
    : null
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
              {statusLabel(language, portal.status)}
            </strong>
            <p>{recommendations[recommendAction(portal, network)]}</p>
          </div>
          <div className="portal-panel__metrics">
            <Metric
              label={t(language, 'energy')}
              value={`${portal.energy}%`}
              percentage={portal.energy}
            />

            <Metric
              label={t(language, 'stability')}
              value={`${portal.stability.toFixed(1)}%`}
              percentage={portal.stability}
            />

            <Metric label={t(language, 'collapse')} value={countdown(portal)} />

            <Metric label={t(language, 'creatures')} value={String(portal.creatures)} />
            <Metric label="INTEL" value={portal.intel + '%'} percentage={portal.intel} />
            <Metric
              label={ru ? 'СЛОЖНОСТЬ' : 'DIFFICULTY'}
              value={portal.difficulty + ' / 6'}
            />
          </div>

          {portal.uncertain && (
            <p className="pause-note">
              {bi(
                language,
                'Осторожный режим: дрейф ×0,65; следующая разведка +25% Intel и −20% энергии.',
                'Caution Protocol: drift ×0.65; next expedition +25% Intel and −20% energy.',
              )}
            </p>
          )}
          <details className="intel-findings">
            <summary>
              {ru ? 'Данные экспедиций' : 'Expedition findings'} · {portal.intel}%
            </summary>
            {findings(portal, language).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </details>
          {portal.status === 'quarantined' && (
            <p className="pause-note">
              {ru
                ? 'Изоляция: таймер ×0,25. Intel не растёт.'
                : 'Quarantine: countdown ×0.25. Intel is frozen.'}{' '}
              {portal.cooldownMs > 0 &&
                (ru ? 'До переключения: ' : 'Toggle in: ') +
                  Math.ceil(portal.cooldownMs / 1000) +
                  's'}
            </p>
          )}
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
              <p>
                {ru ? 'Собственный риск' : 'Intrinsic risk'}: {risk.intrinsic} ·{' '}
                {ru ? 'Давление сети' : 'Network pressure'}: +{risk.pressure} ·{' '}
                {ru ? 'Итоговый риск' : 'Effective risk'}: {risk.score}
              </p>
              <p>
                {ru ? 'Резонанс лаборатории' : 'Lab resonance'}:{' '}
                {labResonance(network).score}% ·{' '}
                {ru
                  ? 'Вклад других порталов, максимум +25. Портал не давит сам на себя.'
                  : 'Other portals contribute pressure, capped at +25. Self-contribution is excluded.'}
              </p>
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

          <p className="pause-note">
            {canInteract
              ? bi(
                  language,
                  'УПРАВЛЕНИЕ · портал в радиусе взаимодействия',
                  'FULL CONTROL · portal within reach',
                )
              : bi(
                  language,
                  'ТОЛЬКО ОСМОТР · Подойдите к порталу для взаимодействия. WASD / стрелки доступны при открытой карточке.',
                  'READ ONLY · APPROACH PORTAL TO INTERACT. WASD / arrows work while this panel is open.',
                )}
          </p>
          <div className="portal-panel__actions">
            {ACTIONS.map((action) => {
              const validation = validations[action]
              const isBlocked = !canInteract || !validation.allowed

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
                  disabled={!canInteract || busy !== null}
                  aria-disabled={isBlocked || busy !== null}
                  aria-busy={busy === action}
                  title={
                    canInteract && validation.reasonCode
                      ? actionReason(language, validation.reasonCode, portal.creatures)
                      : undefined
                  }
                >
                  <span>
                    {busy === action
                      ? ru
                        ? 'ВЫПОЛНЕНИЕ…'
                        : 'EXECUTING…'
                      : action === 'close' && closureKind(portal) === 'safe'
                        ? bi(language, 'БЕЗОПАСНО ЗАКРЫТЬ', 'SAFE CLOSE')
                        : actionLabel(language, action)}
                  </span>

                  {canInteract && (
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
                  )}
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

          {canInteract && pendingAction && preview && previewRisk && (
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
              <ActionPreviewDetails
                portal={portal}
                preview={preview}
                network={network}
                action={pendingAction}
                language={language}
              />

              <div>
                <button type="button" onClick={() => setPendingAction(null)}>
                  {t(language, 'cancel')}
                </button>

                <button
                  type="button"
                  className="confirmation-box__danger"
                  onClick={confirmPendingAction}
                >
                  {pendingAction === 'close' && closureKind(portal) === 'forced'
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
                      {event.category === 'system'
                        ? bi(language, 'СИСТЕМА', 'SYSTEM')
                        : event.status === 'rejected'
                          ? t(language, 'statusRejected')
                          : t(language, 'statusSuccess')}
                    </span>
                    <EventChanges event={event} language={language} />
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
