import { addLogAction, clearLogsAction } from '../logs/log-actions.js'

export function createStateLogApi({ createActionContext }) {
  function addLog(action, details = {}) {
    return addLogAction(createActionContext(), action, details)
  }

  function clearLogs() {
    return clearLogsAction(createActionContext())
  }

  return {
    addLog,
    clearLogs
  }
}
