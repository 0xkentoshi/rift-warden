import type { LabReport } from '../../domain/report/calculateLabReport'
import { priorityPortals } from '../../domain/report/recommendation'
import { effectiveRisk, labResonance } from '../../domain/simulation/network'
import { bi } from '../../i18n/gameplay'
import type { Portal } from '../../types/portal'
import { actionLabel, t, type Language } from '../../i18n/translations'
import type { PortalAction } from '../../domain/validation/validateAction'

interface SystemReportPanelProps {
  report: LabReport
  portals: Portal[]
  onSelectPortal: (id: string) => void
  language: Language
  onClose: () => void
  onLoadEmptyScenario: () => void
}

const ACTIONS: PortalAction[] = [
  'stabilize',
  'observe',
  'mark-uncertain',
  'quarantine',
  'reactivate',
  'close',
]

export function SystemReportPanel({
  report,
  portals,
  onSelectPortal,
  language,
  onClose,
  onLoadEmptyScenario,
}: SystemReportPanelProps) {
  return (
    <div className="panel-backdrop" role="presentation">
      <section
        className="ops-panel ops-panel--report"
        role="dialog"
        aria-modal="true"
        aria-label={t(language, 'terminalSystem')}
      >
        <div className="ops-panel__header">
          <div>
            <span className="ops-panel__eyebrow">RIFT//WARDEN</span>

            <h2>{t(language, 'terminalSystem')}</h2>
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
          <h3>{t(language, 'currentStatus')}</h3>

          <div className="report-grid">
            <ReportMetric label={t(language, 'totalPortals')} value={report.total} />

            <ReportMetric label={t(language, 'open')} value={report.open} />

            <ReportMetric label={t(language, 'closed')} value={report.closed} />

            <ReportMetric
              label={t(language, 'critical')}
              value={report.critical}
              danger={report.critical > 0}
            />

            <ReportMetric label={t(language, 'attention')} value={report.attention} />

            <ReportMetric label={t(language, 'averageRisk')} value={report.averageRisk} />

            <ReportMetric
              label={t(language, 'actionsRecorded')}
              value={report.eventCount}
            />

            <ReportMetric
              label={t(language, 'rejectedActions')}
              value={report.rejectedCount}
              danger={report.rejectedCount > 0}
            />
          </div>

          <div className="report-grid">
            {(
              [
                [bi(language, 'Резонанс', 'Resonance'), report.resonance],
                [bi(language, 'Исследовано', 'Researched'), report.researched],
                [bi(language, 'Нерешённые', 'Unresolved'), report.unresolved],
                [bi(language, 'Изолировано', 'Quarantined'), report.quarantined],
                [bi(language, 'Схлопнулось', 'Collapsed'), report.collapsed],
                [
                  bi(language, 'Принудительных закрытий', 'Forced closures'),
                  report.forced,
                ],
                [bi(language, 'Системных событий', 'System events'), report.systemEvents],
              ] as const
            ).map(([label, value]) => (
              <ReportMetric key={label} label={label} value={value} />
            ))}
          </div>
          <details>
            <summary>
              {bi(
                language,
                'Основные источники резонанса',
                'Main resonance contributors',
              )}
            </summary>
            {labResonance(portals).contributors.map((p) => (
              <p key={p.id}>
                {p.name}: {p.value.toFixed(1)}
              </p>
            ))}
          </details>
          <div className="ops-panel__split">
            <section className="priority-list">
              <h3>{language === 'ru' ? 'В первую очередь' : 'Priority queue'}</h3>
              {priorityPortals(portals).length ? (
                priorityPortals(portals).map((portal, index) => (
                  <button
                    className={
                      'priority-row' +
                      (index === 0 && effectiveRisk(portal, portals).score >= 50
                        ? ' priority-row--urgent'
                        : '')
                    }
                    key={portal.id}
                    onClick={() => onSelectPortal(portal.id)}
                  >
                    <span>
                      {String(index + 1).padStart(2, '0')} · {portal.name}
                    </span>
                    <strong>{effectiveRisk(portal, portals).score}/100 ↗</strong>
                  </button>
                ))
              ) : (
                <p>
                  {language === 'ru'
                    ? 'Порталов, требующих вмешательства, нет.'
                    : 'No portals currently need intervention.'}
                </p>
              )}
            </section>
            <div>
              <h3>{t(language, 'actionBreakdown')}</h3>

              <div className="action-breakdown">
                {ACTIONS.map((action) => (
                  <div key={action}>
                    <span>{actionLabel(language, action)}</span>

                    <strong>{report.actionCounts[action]}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="qa-box">
              <h3>{t(language, 'qaScenarios')}</h3>

              <div className="qa-box__action">
                <div>
                  <strong>{t(language, 'emptyLabScenario')}</strong>

                  <p>{t(language, 'emptyLabDescription')}</p>
                </div>

                <button
                  type="button"
                  className="ops-button"
                  onClick={onLoadEmptyScenario}
                >
                  {t(language, 'emptyLabScenario')}
                </button>
              </div>

              <p>
                {bi(
                  language,
                  'Вернуть начальную смену: Настройки → Начать заново.',
                  'Restore the initial shift: Settings → Restart shift.',
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

interface ReportMetricProps {
  label: string
  value: number
  danger?: boolean
}

function ReportMetric({ label, value, danger = false }: ReportMetricProps) {
  return (
    <div
      className={['report-metric', danger ? 'report-metric--danger' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
