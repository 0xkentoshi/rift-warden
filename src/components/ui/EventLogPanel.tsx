import { actionLabel, t, type Language } from '../../i18n/translations'
import { bi } from '../../i18n/gameplay'
import type { AuditEvent } from '../../types/audit'
import { EventChanges } from './EventChanges'
interface Props {
  events: AuditEvent[]
  language: Language
  onClose: () => void
  onClear: () => void
  latestEventId?: string
  allowClear?: boolean
}
export function EventLogPanel({
  events,
  language,
  onClose,
  onClear,
  latestEventId,
  allowClear = true,
}: Props) {
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
            <span className="ops-panel__eyebrow">RIFT // WARDEN</span>
            <h2>{t(language, 'auditTrail')}</h2>
          </div>
          <button
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
              {[...events].reverse().map((e) => (
                <article
                  key={e.id}
                  className={
                    'event-entry' +
                    (e.id === latestEventId ? ' event-new' : '') +
                    (e.status === 'rejected' ? ' event-entry--rejected' : '')
                  }
                >
                  <div className="event-entry__meta">
                    <time dateTime={e.timestamp}>
                      {new Date(e.timestamp).toLocaleString(
                        language === 'ru' ? 'ru-RU' : 'en-GB',
                      )}
                    </time>
                    <span>
                      {e.category === 'system'
                        ? bi(language, 'СИСТЕМА', 'SYSTEM')
                        : e.status === 'rejected'
                          ? t(language, 'statusRejected')
                          : t(language, 'statusSuccess')}
                    </span>
                  </div>
                  <div className="event-entry__main">
                    <strong>{e.portalName}</strong>
                    <span>{actionLabel(language, e.action)}</span>
                  </div>
                  <EventChanges event={e} language={language} />
                </article>
              ))}
            </div>
          )}
          {allowClear && (
            <div className="ops-panel__footer">
              <button className="ops-button" onClick={onClear} disabled={!events.length}>
                {t(language, 'clearLog')}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
