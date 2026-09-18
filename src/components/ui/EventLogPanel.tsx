import {
  actionLabel,
  actionReason,
  acknowledgedWarning,
  t,
  type Language,
} from '../../i18n/translations'
import type { AuditEvent } from '../../types/audit'

interface EventLogPanelProps {
  events: AuditEvent[]
  language: Language
  onClose: () => void
  onClear: () => void
  latestEventId?: string
}

export function EventLogPanel({
  events,
  language,
  onClose,
  onClear,
  latestEventId,
}: EventLogPanelProps) {
  const locale = language === 'ru' ? 'ru-RU' : 'en-GB'

  return (
    <div className="panel-backdrop" role="presentation">
      <section
        className="ops-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t(language, 'auditTrail')}
      >
        <div className="ops-panel__header">
          <div>
            <span className="ops-panel__eyebrow">RIFT//WARDEN</span>

            <h2>{t(language, 'auditTrail')}</h2>
          </div>

          <button
            type="button"
            className="ops-panel__close"
            onClick={onClose}
            aria-label={t(language, 'closePanel')}
          >
            ×
          </button>
        </div>

        <div className="ops-panel__body">
          {events.length === 0 ? (
            <div className="ops-empty">{t(language, 'noEvents')}</div>
          ) : (
            <div className="event-list">
              {[...events].reverse().map((event) => {
                const reason = event.reasonCode
                  ? event.status === 'success' && event.reasonCode === 'creaturesInside'
                    ? acknowledgedWarning(language, event.creatureCount)
                    : actionReason(language, event.reasonCode, event.creatureCount ?? 0)
                  : null

                return (
                  <article
                    key={event.id}
                    className={[
                      'event-entry',
                      event.id === latestEventId ? 'event-new' : '',
                      event.status === 'rejected' ? 'event-entry--rejected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="event-entry__meta">
                      <time dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleString(locale, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </time>

                      <span>
                        {event.status === 'rejected'
                          ? t(language, 'statusRejected')
                          : t(language, 'statusSuccess')}
                      </span>
                    </div>

                    <div className="event-entry__main">
                      <strong>{event.portalName}</strong>

                      <span>{actionLabel(language, event.action)}</span>
                    </div>

                    <div className="event-entry__risk">
                      {t(language, 'riskBeforeAfter')}:{' '}
                      <strong>{event.beforeRisk}</strong>
                      <span className="event-entry__arrow">→</span>
                      <strong>{event.afterRisk}</strong>
                    </div>

                    {reason && <p className="event-entry__reason">{reason}</p>}
                  </article>
                )
              })}
            </div>
          )}

          <div className="ops-panel__footer">
            <button
              type="button"
              className="ops-button"
              onClick={onClear}
              disabled={events.length === 0}
            >
              {t(language, 'clearLog')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
