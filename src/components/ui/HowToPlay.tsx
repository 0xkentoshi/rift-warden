import type { Language } from '../../i18n/translations'
import { bi } from '../../i18n/gameplay'
import { Modal } from './Modal'
export function HowToPlay({
  language: l,
  first,
  onStart,
  onClose,
}: {
  language: Language
  first: boolean
  onStart: () => void
  onClose: () => void
}) {
  const actions = [
    [
      'STABILIZE',
      'Повышает Stability, снижает Energy и помогает уменьшить Risk.',
      'Raises Stability, lowers Energy and helps reduce Risk.',
    ],
    [
      'SEND OBSERVER',
      'Даёт Intel, но повышает Energy и может увеличить Risk. При критическом риске запрещён.',
      'Gains Intel but raises Energy and may increase Risk. Blocked at critical risk.',
    ],
    [
      'MARK UNCERTAIN',
      'Показания ненадёжны: +10 Risk и Caution Protocol. До успешной разведки — медленнее дрейф, больше Intel и ниже цена энергии.',
      'Unreliable readings: +10 Risk and Caution Protocol. Until successful research: slower drift, more Intel and lower energy cost.',
    ],
    [
      'QUARANTINE / REACTIVATE',
      'Изоляция снижает влияние на сеть и замедляет деградацию. Reactivate возвращает портал в сеть для продолжения исследования.',
      'Isolation reduces network impact and slows degradation. Reactivate reconnects the portal so research can resume.',
    ],
    [
      'SAFE CLOSE / FORCE CLOSE',
      'Закрытие: Intel 100%, нет существ и активного наблюдателя — безопасно. Иначе принудительно, после предупреждения, с Rift Scar.',
      'Closure is safe with 100% Intel, no creatures and no active observer. Otherwise force close requires a warning and leaves a Rift Scar.',
    ],
  ]
  return (
    <Modal
      hideClose={first}
      title={bi(l, 'Как играть', 'How to play')}
      eyebrow="RIFT // WARDEN"
      language={l}
      onClose={first ? () => {} : onClose}
    >
      <p className="pause-note">
        {bi(l, 'ИГРА НА ПАУЗЕ · можно спокойно читать', 'GAME PAUSED · take your time')}
      </p>
      <div className="action-help">
        <h3>{bi(l, 'Цель', 'Objective')}</h3>
        <p>
          {bi(
            l,
            'Управляй шестью связанными порталами: исследуй и стабилизируй разломы, удерживай Lab Resonance под контролем и не допускай Collapse.',
            'Manage six linked portals: research and stabilize the rifts, control Lab Resonance and prevent Collapse.',
          )}
        </p>
        <h3>{bi(l, 'Управление', 'Controls')}</h3>
        <p>
          <kbd>WASD</kbd> / <kbd>↑↓←→</kbd> — {bi(l, 'движение', 'move')}. <kbd>E</kbd> —{' '}
          {bi(l, 'взаимодействие рядом с порталом', 'interact with a nearby portal')}.
        </p>
        <p>
          {bi(
            l,
            'Клик по порталу — осмотр из любой точки комнаты. Удалённо можно только смотреть; для действий подойди по дорожке и ступеням. Двигаться можно и с открытой карточкой. Реестр — только мониторинг.',
            'Click a portal to inspect it from anywhere. Remote access is read-only; approach along its path and stairs to act. Movement also works with the panel open. The registry is monitoring only.',
          )}
        </p>
        <h3>{bi(l, 'Показатели', 'Telemetry')}</h3>
        <p>
          <b>RISK</b> — {bi(l, 'текущая опасность', 'current danger')}. <b>STABILITY</b> —{' '}
          {bi(
            l,
            'устойчивость, со временем снижается',
            'resilience, drifts down over time',
          )}
          .
        </p>
        <p>
          <b>ENERGY</b> —{' '}
          {bi(
            l,
            'активность: высокая повышает риск',
            'activity: high levels increase risk',
          )}
          . <b>INTEL</b> — {bi(l, 'прогресс исследования', 'research progress')}.
        </p>
        <p>
          <b>TIME TO COLLAPSE</b> —{' '}
          {bi(l, 'игровое время до разрушения', 'game time until collapse')}.{' '}
          <b>LAB RESONANCE</b> —{' '}
          {bi(
            l,
            'нестабильность сети. Опасные порталы давят на соседей.',
            'network instability. Dangerous portals pressure their neighbors.',
          )}
        </p>
        <h3>{bi(l, 'Действия', 'Actions')}</h3>
        {actions.map(([name, ru, en]) => (
          <p key={name}>
            <b>{name}</b> — {bi(l, ru, en)}
          </p>
        ))}
        <h3>Rift Scars</h3>
        <p>
          {bi(
            l,
            'Force Close повреждает containment: +6 к резонансу, с активным наблюдателем +12. Штраф сохраняется до Restart Shift. Safe Close — без штрафа.',
            'Force Close damages containment: +6 resonance, or +12 with an active observer. The penalty lasts until Restart Shift. Safe Close has no penalty.',
          )}
        </p>
        <h3>{bi(l, 'Скорость и пауза', 'Speed & pause')}</h3>
        <p>
          0.5× / 1× / 1.5× / 2× / 5× —{' '}
          {bi(
            l,
            'скорость симуляции, обратного отсчёта, дрейфа Stability, игровых таймеров и движения персонажа. Не влияет на отзывчивость UI. Settings, How to Play и другие системные экраны ставят игру на паузу. Осмотр портала и выбор действий — нет.',
            'speed of simulation, countdown, Stability drift, gameplay timers and character movement. UI responsiveness is unaffected. Settings, How to Play and other system screens pause the game. Portal inspection and action previews do not.',
          )}
        </p>
        <h3>{bi(l, 'Прогрессия', 'Progression')}</h3>
        <p>
          {bi(
            l,
            'Начни с Green: по часовой стрелке сложность растёт до Red. Любой порядок разрешён. Следи за Risk и Lab Resonance.',
            'Start with Green: difficulty rises clockwise toward Red. Any order is allowed. Watch both Risk and Lab Resonance.',
          )}
        </p>
        <p>
          {bi(
            l,
            'Исследуй и успокой все оставшиеся открытые порталы или закрой их. Три схлопнувшихся портала — потеря лаборатории.',
            'Research and calm every remaining open rift, or close it. Three collapsed rifts mean the laboratory is lost.',
          )}
        </p>
      </div>
      <button className="ops-button" onClick={first ? onStart : onClose}>
        {first ? bi(l, 'НАЧАТЬ СМЕНУ', 'START SHIFT') : bi(l, 'ПРОДОЛЖИТЬ', 'RESUME')}
      </button>
    </Modal>
  )
}
