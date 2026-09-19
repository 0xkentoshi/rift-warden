import type { Portal } from '../../types/portal'
import type { Language } from '../../i18n/translations'
import { riskLevelLabel } from '../../i18n/translations'
import { bi, countdown, statusLabel } from '../../i18n/gameplay'
import { effectiveRisk, labResonance } from '../../domain/simulation/network'
import { closureKind } from '../../domain/actions/applyAction'
import type { PortalAction } from '../../domain/validation/validateAction'
export function ActionPreviewDetails({
  portal: p,
  preview: n,
  network,
  action,
  language: l,
}: {
  portal: Portal
  preview: Portal
  network: Portal[]
  action: PortalAction
  language: Language
}) {
  const nextNetwork = network.map((q) => (q.id === p.id ? n : q)),
    before = effectiveRisk(p, network),
    after = effectiveRisk(n, nextNetwork)
  const risk = (r: typeof before) => r.score + ' ' + riskLevelLabel(l, r.level)
  const diffs = [
    [bi(l, 'Риск', 'Risk'), risk(before), risk(after)],
    ['Intel', p.intel + '%', n.intel + '%'],
    [bi(l, 'Энергия', 'Energy'), p.energy + '%', n.energy + '%'],
    [bi(l, 'Стабильность', 'Stability'), p.stability + '%', n.stability + '%'],
    [bi(l, 'До схлопывания', 'Time to collapse'), countdown(p), countdown(n)],
    [bi(l, 'Статус', 'Status'), statusLabel(l, p.status), statusLabel(l, n.status)],
    [
      bi(l, 'Резонанс', 'Resonance'),
      labResonance(network).score + '%',
      labResonance(nextNetwork).score + '%',
    ],
  ].filter(([, a, b]) => a !== b)
  return (
    <>
      {action === 'close' && closureKind(p) === 'forced' && (
        <p className="preview-warning">
          {bi(l, '⚠ НЕБЕЗОПАСНОЕ ЗАКРЫТИЕ', '⚠ UNSAFE CLOSURE')} · Intel {p.intel}%.{' '}
          {p.intel < 100 &&
            bi(
              l,
              'Портал изучен не полностью; неизвестные аномалии или существа могут остаться внутри.',
              'This rift is not fully studied; unknown anomalies or occupants may remain inside.',
            )}
        </p>
      )}
      <dl className="preview-grid">
        {diffs.map(([label, a, b]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {a} → <b>{b}</b>
            </dd>
          </div>
        ))}
      </dl>
      {action === 'observe' && (
        <p className="preview-warning">
          {bi(
            l,
            'Переход наблюдателя увеличит активность портала. Данные и энергия изменятся вместе после подтверждения.',
            'Observer traversal increases portal activity. Intel and energy change together after confirmation.',
          )}
          {after.level === 'CRITICAL' && before.level !== 'CRITICAL' && (
            <strong>
              {bi(
                l,
                ' Эта экспедиция может сделать риск КРИТИЧЕСКИМ.',
                ' This expedition may push the portal into CRITICAL state.',
              )}
            </strong>
          )}
        </p>
      )}
      {action === 'quarantine' && (
        <p>
          {bi(
            l,
            'Изоляция: таймер ×0,25; вклад в резонанс ×0,15. Портал остаётся нерешённым. Переключение доступно через 10 секунд активной игры.',
            'Isolation: countdown ×0.25; resonance contribution ×0.15. The rift remains unresolved. Switching is available after 10 active gameplay seconds.',
          )}
        </p>
      )}
      {action === 'reactivate' && (
        <p>
          {bi(
            l,
            'Полная скорость таймера и вклад в сеть возвращаются. Энергия увеличивается; следующее переключение через 10 секунд активной игры.',
            'Normal countdown and network contribution return. Energy increases; the next toggle unlocks after 10 active seconds.',
          )}
        </p>
      )}
      <p className="subtle-copy">
        {bi(
          l,
          'Это прогноз. До подтверждения ничего не изменяется; игровое время на паузе.',
          'This is a preview. Nothing changes before confirmation; gameplay time is paused.',
        )}
      </p>
    </>
  )
}
