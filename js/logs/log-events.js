import { renderTab } from '../tabs/tabs-render.js'
import { clearLogsFromState } from './log-state.js'

export function attachDetailedLoggEvents({ container, onPageChange, onClearLogs }) {
  container.onclick = (event) => {
    const clearButton = event.target.closest('#clearDetailedLogsBtn')

    if (clearButton) {
      const confirmed = confirm('Vil du tømme hele endringsloggen?')

      if (!confirmed) return

      onClearLogs()
      clearLogsFromState()
      renderTab()
      return
    }

    const pageButton = event.target.closest('[data-detailed-log-page]')

    if (!pageButton) return

    onPageChange(pageButton.dataset.detailedLogPage)
    renderTab()
  }
}
