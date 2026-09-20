import { useEffect } from 'react'
export function useModalFocus(activeKey: string | null) {
  useEffect(() => {
    if (!activeKey) return
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    if (!dialog) return
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, textarea, summary, a[href], [tabindex="0"]',
        ),
      ).filter((element) => !element.hidden)
    if (dialog.hasAttribute('data-movement-surface')) dialog.focus()
    else focusable()[0]?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const elements = focusable()
      if (!elements.length) {
        event.preventDefault()
        return
      }
      const index = elements.indexOf(document.activeElement as HTMLElement)
      if (event.shiftKey && index <= 0) {
        event.preventDefault()
        elements.at(-1)?.focus()
      } else if (!event.shiftKey && (index === elements.length - 1 || index === -1)) {
        event.preventDefault()
        elements[0].focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => {
      document.removeEventListener('keydown', trap)
      if (previous?.isConnected) previous.focus()
    }
  }, [activeKey])
}
