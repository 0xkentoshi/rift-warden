import { useState } from 'react'
import { calculateRisk } from '../../domain/risk/calculateRisk'
import { riskLevelLabel, t, type Language } from '../../i18n/translations'
import type { Portal } from '../../types/portal'
import { Modal } from './Modal'
import { portalPositions } from '../../data/labLayout'
import type { CSSProperties } from 'react'
export function PortalRegistry({
  portals,
  language,
  onSelect,
  onClose,
}: {
  portals: Portal[]
  language: Language
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState('all')
  const ru = language === 'ru'
  const visible = [...portals]
    .filter(
      (p) =>
        filter === 'all' ||
        p.status === filter ||
        (filter === 'attention' && p.status === 'open' && calculateRisk(p).score >= 25),
    )
    .sort((a, b) => calculateRisk(b).score - calculateRisk(a).score)
  return (
    <Modal
      title={ru ? 'Реестр порталов' : 'Portal registry'}
      language={language}
      onClose={onClose}
    >
      <p className="intro-copy">
        {ru
          ? 'Вы — смотритель. Начните с опасного портала: изучите риск, стабилизируйте его или закройте с учётом существ внутри. Все действия сохраняются в журнале.'
          : 'You are the warden. Start with a dangerous portal: inspect its risk, stabilize it or close it after checking for creatures. Every action is recorded.'}
      </p>
      <label className="registry-filter">
        {ru ? 'Показать' : 'Show'}{' '}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">{ru ? 'Все порталы' : 'All portals'}</option>
          <option value="attention">{ru ? 'С риском от 25' : 'Risk 25 and above'}</option>
          <option value="open">{t(language, 'open')}</option>
          <option value="closed">{t(language, 'closed')}</option>
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
                  ru ? 'Статус / риск' : 'Status / risk',
                ].map((v) => (
                  <th key={v}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((portal, index) => {
                const risk = calculateRisk(portal)
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
                      <button className="text-button" onClick={() => onSelect(portal.id)}>
                        {portal.name} ↗
                      </button>
                      <small>{portal.destination}</small>
                    </td>
                    <td>{portal.energy}%</td>
                    <td>{portal.stability}%</td>
                    <td>
                      {portal.status === 'closed'
                        ? '—'
                        : portal.collapseMinutes + ' ' + t(language, 'minutes')}
                    </td>
                    <td>{portal.creatures}</td>
                    <td>
                      <span
                        className={'risk-text risk-text--' + risk.level.toLowerCase()}
                      >
                        {portal.status === 'closed'
                          ? t(language, 'closed')
                          : t(language, 'open') +
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
          ? 'Время до схлопывания — показание телеметрии, а не таймер реального времени.'
          : 'Time to collapse is a telemetry reading, not a live countdown.'}
      </p>
    </Modal>
  )
}
