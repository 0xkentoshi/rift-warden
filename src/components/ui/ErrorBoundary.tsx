import { Component, type ReactNode } from 'react'
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="error-screen" role="alert">
          <h1>RIFT // WARDEN</h1>
          <h2>Не удалось открыть лабораторию / Laboratory unavailable</h2>
          <p>
            Произошла ошибка. Перезагрузите страницу. Сохранённые данные останутся в
            браузере.
            <br />
            Something went wrong. Reload the page; saved data stays in your browser.
          </p>
          <button className="ops-button" onClick={() => window.location.reload()}>
            Перезагрузить / Reload
          </button>
        </main>
      )
    return this.props.children
  }
}
