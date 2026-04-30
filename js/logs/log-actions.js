import { MAX_LOGS } from '../app/constants.js'
import { createLogEntry } from './log-utils.js'

export function addLogAction(context, action, details = {}) {
  const { state, getCurrentWeekId, getCurrentWeekLabel } = context

  const log = createLogEntry({
    action,
    details,
    weekId: getCurrentWeekId(),
    weekLabel: getCurrentWeekLabel()
  })

  state.logs = [log, ...(state.logs || [])].slice(0, MAX_LOGS)
}

export function clearLogsAction(context) {
  const { state, persistState } = context

  state.logs = []

  persistState()
}