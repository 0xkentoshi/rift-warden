import type { GameState } from '../../domain/simulation/runtime'
import type { Language } from '../../i18n/translations'
import { bi } from '../../i18n/gameplay'
import { calculateLabReport } from '../../domain/report/calculateLabReport'
import { Modal } from './Modal'
export function ShiftResult({
  game,
  language: l,
  onRestart,
  onLog,
}: {
  game: GameState
  language: Language
  onRestart: () => void
  onLog: () => void
}) {
  const r = calculateLabReport(game.portals, game.events),
    lost = game.phase === 'GAME_OVER'
  return (
    <Modal
      hideClose={true}
      title={
        lost
          ? bi(l, 'Лаборатория потеряна', 'Laboratory lost')
          : bi(l, 'Смена завершена', 'Shift complete')
      }
      language={l}
      onClose={() => {}}
    >
      <p className="result-heading">
        {lost ? '✕' : '✦'}{' '}
        {lost
          ? bi(
              l,
              'Каскад превысил предел сдерживания.',
              'The cascade exceeded containment capacity.',
            )
          : bi(
              l,
              'Сеть обезопасена. Итог отражает реальные исследования и потери.',
              'Network secured. The result reflects actual research and losses.',
            )}
      </p>
      <div className="report-grid">
        <div className="report-metric">
          <span>{bi(l, 'Исследовано', 'Researched')}</span>
          <strong>
            {r.researched} / {r.total}
          </strong>
        </div>
        <div className="report-metric">
          <span>{bi(l, 'Схлопнулось', 'Collapsed')}</span>
          <strong>
            {r.collapsed} / {r.total}
          </strong>
        </div>
        <div className="report-metric">
          <span>{bi(l, 'Резонанс при завершении', 'Resonance at completion')}</span>
          <strong>{game.finalResonance}%</strong>
        </div>
        <div className="report-metric">
          <span>{bi(l, 'Принудительных закрытий', 'Forced closures')}</span>
          <strong>{r.forced}</strong>
        </div>
        <div className="report-metric">
          <span>{bi(l, 'Критических инцидентов', 'Critical incidents')}</span>
          <strong>
            {game.events.filter((e) => e.action === 'portal-collapsed').length}
          </strong>
        </div>
      </div>
      <div className="confirmation-box">
        <button onClick={onRestart}>{bi(l, 'НАЧАТЬ ЗАНОВО', 'RESTART SHIFT')}</button>
        <button onClick={onLog}>{bi(l, 'ЖУРНАЛ ИНЦИДЕНТОВ', 'VIEW INCIDENT LOG')}</button>
      </div>
    </Modal>
  )
}
