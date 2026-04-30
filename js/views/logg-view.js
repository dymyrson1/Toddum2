import { attachLoggEvents } from '../logs/log-events.js'
import { renderLoggLayout } from '../logs/log-render.js'
import { getSortedLogsFromState } from '../logs/log-state.js'

export function renderLoggView(container) {
  const logs = getSortedLogsFromState()

  container.innerHTML = renderLoggLayout(logs)

  attachLoggEvents(container)
}
