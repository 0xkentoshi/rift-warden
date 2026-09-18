import { calculateLabReport } from '../../domain/report/calculateLabReport'
import { t, type Language } from '../../i18n/translations'
import type { Portal } from '../../types/portal'
interface Props {
  portals: Portal[]
  language: Language
  musicEnabled: boolean
  onLanguageChange: (language: Language) => void
  onOpenEventLog: () => void
  onOpenSystem: () => void
  onOpenSettings: () => void
  onToggleMusic: () => void
  onOpenRegistry: () => void
  onOpenWorklog: () => void
  latestEventId?: string
}
export function Hud(p: Props) {
  const report = calculateLabReport(p.portals, [])
  return (
    <>
      <header className="hud">
        <div className="hud__brand">
          <span className="hud__brand-main">
            <i>◇</i> RIFT // WARDEN
          </span>
          <span className="hud__brand-sub">ARCANE PORTAL CONTROL SYSTEM</span>
        </div>
        <div
          className="hud__stats"
          aria-label={p.language === 'ru' ? 'Состояние лаборатории' : 'Laboratory status'}
        >
          {(['open', 'critical', 'attention', 'closed'] as const).map((key) => (
            <div
              className={
                'hud__stat hud__stat--' +
                key +
                (key === 'critical' && report.critical > 0 ? ' is-alert' : '')
              }
              key={key}
            >
              <span>{t(p.language, key)}</span>
              <strong className="counter-value" key={report[key]}>
                {report[key]}
              </strong>
            </div>
          ))}
        </div>
        <nav
          className="hud__nav"
          aria-label={
            p.language === 'ru' ? 'Инструменты лаборатории' : 'Laboratory tools'
          }
        >
          <button onClick={p.onOpenEventLog}>
            {t(p.language, 'eventLog')}
            {p.latestEventId && (
              <i className="journal-ping" key={p.latestEventId} aria-hidden="true" />
            )}
          </button>
          <button onClick={p.onOpenSystem}>{t(p.language, 'system')}</button>
          <div className="hud__languages">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                className={p.language === lang ? 'is-active' : ''}
                aria-pressed={p.language === lang}
                onClick={() => p.onLanguageChange(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="hud__icon"
            onClick={p.onOpenSettings}
            aria-label={p.language === 'ru' ? 'Настройки' : 'Settings'}
          >
            ⚙
          </button>
          <button
            className="hud__icon"
            onClick={p.onToggleMusic}
            aria-pressed={p.musicEnabled}
            aria-label={p.language === 'ru' ? 'Музыка' : 'Music'}
          >
            {p.musicEnabled ? '♫' : '♪'}
            <span className={'music-dot' + (p.musicEnabled ? ' is-on' : '')} />
          </button>
        </nav>
      </header>
      <nav
        className="lab-tools"
        aria-label={
          p.language === 'ru' ? 'Реестр и разработка' : 'Registry and development'
        }
      >
        <button onClick={p.onOpenRegistry}>
          <span>▤</span> {p.language === 'ru' ? 'РЕЕСТР ПОРТАЛОВ' : 'PORTAL REGISTRY'}{' '}
          <small>{p.portals.length.toString().padStart(2, '0')}</small>
        </button>
        <button onClick={p.onOpenWorklog}>
          AI WORKLOG <span>↗</span>
        </button>
      </nav>
    </>
  )
}
