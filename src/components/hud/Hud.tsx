import { TIME_SCALES } from '../../domain/simulation/drift'
import { labResonance, containmentDamage } from '../../domain/simulation/network'
import { bi, resonanceLabel } from '../../i18n/gameplay'
import { calculateLabReport } from '../../domain/report/calculateLabReport'
import { t, type Language } from '../../i18n/translations'
import type { Portal } from '../../types/portal'
interface Props {
  timeScale: number
  onTimeScaleChange: (value: number) => void
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
  onOpenHelp: () => void
  latestEventId?: string
}
export function Hud(p: Props) {
  const report = calculateLabReport(p.portals, [])
  const resonance = labResonance(p.portals)
  return (
    <>
      <header className="hud">
        <div className="hud__brand">
          <span className="hud__brand-main">
            <i>◇</i> RIFT // WARDEN
          </span>
          <button
            className="network-meter"
            onClick={p.onOpenSystem}
            title={bi(
              p.language,
              'Открыть вклад порталов в резонанс',
              'Inspect portal resonance contributions',
            )}
          >
            {bi(p.language, 'РЕЗОНАНС', 'RESONANCE')} {resonance.score}% ·{' '}
            {resonanceLabel(p.language, resonance.level)}
            {containmentDamage(p.portals) > 0 &&
              ' · Scar +' + containmentDamage(p.portals)}
          </button>
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
          <label className="time-scale">
            {bi(p.language, 'Темп', 'Speed')}
            <select
              aria-label={bi(p.language, 'Скорость симуляции', 'Simulation speed')}
              value={p.timeScale}
              onChange={(e) => p.onTimeScaleChange(Number(e.target.value))}
            >
              {TIME_SCALES.map((v) => (
                <option key={v} value={v}>
                  {v}×
                </option>
              ))}
            </select>
          </label>
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
            onClick={p.onOpenHelp}
            aria-label={bi(p.language, 'КАК ИГРАТЬ', 'HOW TO PLAY')}
            title={bi(p.language, 'КАК ИГРАТЬ', 'HOW TO PLAY')}
          >
            ?
          </button>
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
