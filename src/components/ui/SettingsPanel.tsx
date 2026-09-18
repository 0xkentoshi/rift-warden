import type { Language } from '../../i18n/translations'

interface SettingsPanelProps {
  language: Language
  musicEnabled: boolean
  volume: number
  onMusicEnabledChange: (enabled: boolean) => void
  onVolumeChange: (volume: number) => void
  onReset: () => void
  onClose: () => void
}

export function SettingsPanel({
  language,
  musicEnabled,
  volume,
  onMusicEnabledChange,
  onVolumeChange,
  onReset,
  onClose,
}: SettingsPanelProps) {
  const ru = language === 'ru'

  return (
    <div className="panel-backdrop" role="presentation">
      <section
        className="ops-panel settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label={ru ? 'Настройки' : 'Settings'}
      >
        <div className="ops-panel__header">
          <div>
            <span className="ops-panel__eyebrow">{ru ? 'СИСТЕМА' : 'SYSTEM'}</span>
            <h2>{ru ? 'Настройки' : 'Settings'}</h2>
            <p>
              {ru
                ? 'Музыка, громкость и управление лабораторией.'
                : 'Music, volume and laboratory controls.'}
            </p>
          </div>

          <button
            type="button"
            className="ops-panel__close"
            onClick={onClose}
            aria-label={ru ? 'Закрыть' : 'Close'}
          >
            ×
          </button>
        </div>

        <div className="ops-panel__body settings-panel__body">
          <section className="settings-card">
            <div className="settings-card__heading">
              <strong>{ru ? 'Музыка' : 'Music'}</strong>
              <button
                type="button"
                className={['settings-toggle', musicEnabled ? 'is-active' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onMusicEnabledChange(!musicEnabled)}
              >
                {musicEnabled ? (ru ? 'ВКЛ' : 'ON') : ru ? 'ВЫКЛ' : 'OFF'}
              </button>
            </div>

            <label className="settings-volume">
              <span>{ru ? 'Громкость' : 'Volume'}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
              />
              <strong>{Math.round(volume * 100)}%</strong>
            </label>
          </section>

          <section className="settings-card">
            <strong>{ru ? 'Управление' : 'Controls'}</strong>

            <div className="settings-controls-grid">
              <div>
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd>
                <span>{ru ? 'Движение' : 'Move'}</span>
              </div>
              <div>
                <kbd>↑</kbd>
                <kbd>←</kbd>
                <kbd>↓</kbd>
                <kbd>→</kbd>
                <span>{ru ? 'Альтернативное движение' : 'Alternate move'}</span>
              </div>
              <div>
                <kbd>E</kbd>
                <span>{ru ? 'Взаимодействие' : 'Interact'}</span>
              </div>
              <div>
                <kbd>ESC</kbd>
                <span>{ru ? 'Закрыть окно' : 'Close panel'}</span>
              </div>
            </div>
          </section>

          <section className="settings-card settings-card--danger">
            <div>
              <strong>{ru ? 'Демо-состояние' : 'Demo state'}</strong>
              <p>
                {ru
                  ? 'Сбросить порталы, журнал и состояние лаборатории.'
                  : 'Reset portals, audit log and laboratory state.'}
              </p>
            </div>
            <button type="button" className="ops-button" onClick={onReset}>
              {ru ? 'СБРОСИТЬ ЛАБ.' : 'RESET LAB'}
            </button>
          </section>
        </div>
      </section>
    </div>
  )
}
