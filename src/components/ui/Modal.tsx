import type { ReactNode } from 'react'
import { t, type Language } from '../../i18n/translations'
export function Modal({
  title,
  eyebrow = 'RIFT // WARDEN',
  language,
  onClose,
  children,
}: {
  title: string
  eyebrow?: string
  language: Language
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="panel-backdrop">
      <section className="ops-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ops-panel__header">
          <div>
            <span className="ops-panel__eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button
            className="ops-panel__close"
            onClick={onClose}
            aria-label={t(language, 'closePanel')}
          >
            ×
          </button>
        </div>
        <div className="ops-panel__body">{children}</div>
      </section>
    </div>
  )
}
