import { clearLogs, state } from '../state.js'
import { sortLogsByDate } from './log-data.js'

export function getSortedLogsFromState() {
  return sortLogsByDate(state.logs || [])
}

export function clearLogsFromState() {
  clearLogs()
}
