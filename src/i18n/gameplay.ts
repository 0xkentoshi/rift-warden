import type { Portal, PortalStatus } from '../types/portal'
import type { Language } from './translations'
import { isInactive } from '../domain/simulation/network'
export const bi = (language: Language, ru: string, en: string) =>
  language === 'ru' ? ru : en
export function statusLabel(l: Language, s: PortalStatus) {
  const labels: Record<PortalStatus, [string, string]> = {
    open: ['ОТКРЫТО', 'OPEN'],
    closed: ['ЗАКРЫТО', 'CLOSED'],
    quarantined: ['ИЗОЛИРОВАН', 'QUARANTINED'],
    collapsing: ['СХЛОПЫВАНИЕ', 'COLLAPSING'],
    collapsed: ['ПОТЕРЯН', 'COLLAPSED'],
  }
  return bi(l, ...labels[s])
}
export function countdown(p: Portal) {
  if (isInactive(p)) return '—'
  const seconds = Math.max(0, Math.ceil(p.collapseMinutes * 60))
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
}
export function resonanceLabel(l: Language, level: string) {
  const labels: Record<string, [string, string]> = {
    STABLE: ['СТАБИЛЬНЫЙ', 'STABLE'],
    ELEVATED: ['ПОВЫШЕННЫЙ', 'ELEVATED'],
    DANGEROUS: ['ОПАСНЫЙ', 'DANGEROUS'],
    CRITICAL: ['КРИТИЧЕСКИЙ', 'CRITICAL'],
  }
  return bi(l, ...labels[level])
}
export function findings(p: Portal, l: Language): string[] {
  const traits: Record<number, [string, string]> = {
    1: [
      'Влажная мшистая долина; колебания плавные.',
      'A damp mossy valley; fluctuations are gentle.',
    ],
    2: [
      'Отражения запаздывают; не следуйте за своим двойником.',
      'Reflections lag behind; do not follow your double.',
    ],
    3: [
      'Звёздная пыль проводит энергию; держите шлюз чистым.',
      'Stardust conducts energy; keep the airlock clear.',
    ],
    4: [
      'Тихий архив поглощает звук; сверяйте световые сигналы.',
      'The silent archive absorbs sound; use visual signals.',
    ],
    5: [
      'Пустота меняет локальную гравитацию; нужен страховочный трос.',
      'The void shifts local gravity; use a safety tether.',
    ],
    6: [
      'Пепельные потоки перегружают контур; вентиляция обязательна.',
      'Ash currents overload the circuit; venting is essential.',
    ],
  }
  return [
    ...(p.intel >= 25
      ? [bi(l, ...traits[p.difficulty])]
      : [
          bi(
            l,
            'Свойства мира пока не установлены.',
            'World traits are not yet established.',
          ),
        ]),
    bi(
      l,
      'Достоверность телеметрии: ' +
        (p.intel < 50 ? 'низкая' : p.intel < 100 ? 'уточняется' : 'полная') +
        '.',
      'Telemetry confidence: ' +
        (p.intel < 50 ? 'low' : p.intel < 100 ? 'improving' : 'complete') +
        '.',
    ),
    bi(
      l,
      p.intel >= 75
        ? 'Существ подтверждено: ' + p.creatures + '.'
        : 'Базовых сигналов жизни: ' + p.creatures + '. Данные требуют проверки.',
      p.intel >= 75
        ? 'Confirmed occupants: ' + p.creatures + '.'
        : 'Base life signs: ' + p.creatures + '. Further verification needed.',
    ),
    ...(p.intel >= 100
      ? [
          bi(
            l,
            'Все доступные аномалии описаны. Закрытие при существах всё равно требует предупреждения.',
            'All available anomalies are documented. Occupied closures still require a warning.',
          ),
        ]
      : []),
  ]
}
