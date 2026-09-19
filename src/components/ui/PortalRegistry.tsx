import { useState } from 'react'
import { effectiveRisk, isLive } from '../../domain/simulation/network'
import { countdown, statusLabel } from '../../i18n/gameplay'
import { riskLevelLabel, t, type Language } from '../../i18n/translations'
import type { Portal } from '../../types/portal'
import { Modal } from './Modal'
import { portalPositions } from '../../data/labLayout'
import type { CSSProperties } from 'react'
export function PortalRegistry({
  portals,
  language,
  onClose,
}: {
  portals: Portal[]
  language: Language
  onClose: () => void
}) {
  const [filter, setFilter] = useState('all')
  const ru = language === 'ru'
  const visible = [...portals]
    .filter(
      (p) =>
        filter === 'all' ||
        p.status === filter ||
        (filter === 'attention' && isLive(p) && effectiveRisk(p, portals).score >= 25),
    )
    .sort((a, b) => effectiveRisk(b, portals).score - effectiveRisk(a, portals).score)
  return (
    <Modal
      title={ru ? 'Реестр порталов' : 'Portal registry'}
      language={language}
      onClose={onClose}
    >
      <p className="intro-copy">
        {ru
          ? 'Вы — смотритель. Начните с зелёного портала: изучите риск, стабилизируйте его или закройте с учётом существ внутри. Все действия сохраняются в журнале.'
          : 'You are the warden. Start with the green portal: inspect its risk, stabilize it or close it after checking for creatures. Every action is recorded.'}
      </p>
      <label className="registry-filter">
        {ru ? 'Показать' : 'Show'}{' '}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">{ru ? 'Все порталы' : 'All portals'}</option>
          <option value="attention">{ru ? 'С риском от 25' : 'Risk 25 and above'}</option>
          <option value="open">{t(language, 'open')}</option>
          <option value="closed">{t(language, 'closed')}</option>
          <option value="quarantined">{statusLabel(language, 'quarantined')}</option>
          <option value="collapsed">{statusLabel(language, 'collapsed')}</option>
        </select>
      </label>
      {visible.length ? (
        <div className="registry-scroll">
          <table className="registry-table">
            <thead>
              <tr>
                {[
                  ru ? 'Портал / мир' : 'Portal / world',
                  t(language, 'energy'),
                  t(language, 'stability'),
                  t(language, 'collapse'),
                  t(language, 'creatures'),
                  'Intel',
                  ru ? 'Статус / риск' : 'Status / risk',
                ].map((v) => (
                  <th key={v}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((portal, index) => {
                const risk = effectiveRisk(portal, portals)
                return (
                  <tr
                    key={portal.id}
                    style={
                      {
                        '--portal-ink': portalPositions[portal.id]?.color ?? '#c4ad79',
                      } as CSSProperties
                    }
                  >
                    <td>
                      <span className="registry-seal" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-button">{portal.name}</span>
                      <small>{portal.destination}</small>
                    </td>
                    <td>{portal.energy}%</td>
                    <td>{portal.stability.toFixed(1)}%</td>
                    <td>{countdown(portal)}</td>
                    <td>{portal.creatures}</td>
                    <td>{portal.intel}%</td>
                    <td>
                      <span
                        className={'risk-text risk-text--' + risk.level.toLowerCase()}
                      >
                        {statusLabel(language, portal.status) +
                          ' · ' +
                          riskLevelLabel(language, risk.level) +
                          ' ' +
                          risk.score}
                      </span>
                      {portal.uncertain && (
                        <small>{ru ? 'Под вопросом' : 'Uncertain'}</small>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ops-empty">
          {portals.length
            ? ru
              ? 'По этому фильтру порталов нет.'
              : 'No portals match this filter.'
            : t(language, 'noActivePortalsHint')}
        </div>
      )}
      <p className="subtle-copy">
        {ru
          ? 'Время — живой обратный отсчёт. Реестр на паузе, только мониторинг. Действия: подойти к порталу и нажать E. Изоляция замедляет его в 4 раза.'
          : 'Time is a live countdown. Registry pauses gameplay and is read-only. Approach a portal and press E for actions. Quarantine slows it fourfold.'}
      </p>
    </Modal>
  )
}
