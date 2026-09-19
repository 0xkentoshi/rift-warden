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
      <p>
        {bi(
          l,
          'Ты — смотритель шести связанных порталов. Исследуй разломы и удержи сеть под контролем.',
          'You watch over six linked portals. Research the rifts and keep the network contained.',
        )}
      </p>
      <ol className="help-steps">
        <li>
          {bi(
            l,
            'Начни с зелёного. По часовой стрелке сложность растёт: оранжевый → синий → чёрный → фиолетовый → красный. Любой порядок разрешён.',
            'Start with green. Clockwise difficulty rises: orange → blue → black → purple → red. Any order is allowed.',
          )}
        </li>
        <li>
          {bi(
            l,
            'Наблюдатель даёт Intel, но повышает энергию. Повторные экспедиции дороже. При критическом риске сначала стабилизируй или изолируй портал.',
            'Observers collect Intel but raise energy. Repeat expeditions cost more. At critical risk, stabilize or isolate first.',
          )}
        </li>
        <li>
          {bi(
            l,
            'Опасные порталы создают резонанс и давят на соседей. Карантин снижает этот вклад и замедляет время в 4 раза, но не решает проблему навсегда.',
            'Dangerous portals create resonance and pressure their neighbors. Quarantine reduces contribution and slows time fourfold, but does not resolve the rift.',
          )}
        </li>
        <li>
          {bi(
            l,
            'Intel 100% и отсутствие существ позволяют безопасное закрытие. Иначе доступно принудительное — после предупреждения. Полные данные всегда видны в карточке.',
            'Intel 100% and no occupants allow safe closure. Otherwise force close remains available after a warning. Core readings are always visible.',
          )}
        </li>
        <li>
          {bi(
            l,
            'Исследуй и успокой все оставшиеся открытые порталы или закрой их. Три схлопнувшихся портала означают потерю лаборатории. Все окна останавливают игровое время.',
            'Research and calm every remaining open rift, or close it. Three collapsed rifts mean the laboratory is lost. Every modal pauses gameplay time.',
          )}
        </li>
      </ol>
      <p>
        <kbd>WASD</kbd> / <kbd>↑↓←→</kbd> — {bi(l, 'движение', 'move')} · <kbd>E</kbd> —{' '}
        {bi(l, 'осмотр', 'inspect')}.{' '}
        {bi(
          l,
          'Клик по арке или реестр работают без перемещения.',
          'Click an arch or use the registry without moving.',
        )}
      </p>
      <details>
        <summary>{bi(l, 'Быстрая проверка задания', 'Quick assignment review')}</summary>
        <p>
          {bi(
            l,
            'Красный: запрет наблюдателя → стабилизация → риск ниже → предупреждение о существах при закрытии. Синий: Intel 100 → безопасное закрытие. Далее журнал, система и AI Worklog. Проходить смену целиком не требуется.',
            'Red: blocked observer → stabilize → lower risk → creature warning on close. Blue: Intel 100 → safe close. Then inspect the log, system report and AI Worklog. No full playthrough is required.',
          )}
        </p>
      </details>
      <button className="ops-button" onClick={first ? onStart : onClose}>
        {first ? bi(l, 'НАЧАТЬ СМЕНУ', 'START SHIFT') : bi(l, 'ПРОДОЛЖИТЬ', 'RESUME')}
      </button>
    </Modal>
  )
}
