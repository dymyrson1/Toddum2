import {
  clampLogPage,
  getPagedLogs,
  getTotalLogPages,
  LOGS_PER_PAGE
} from '../logs/log-data.js'

import { attachDetailedLoggEvents } from '../logs/log-events.js'
import { renderDetailedLoggLayout } from '../logs/log-render.js'
import { getSortedLogsFromState } from '../logs/log-state.js'

let currentPage = 1

export function renderLoggDetaljertView(container) {
  const logs = getSortedLogsFromState()
  const totalPages = getTotalLogPages(logs.length, LOGS_PER_PAGE)

  currentPage = clampLogPage(currentPage, totalPages)

  const pageLogs = getPagedLogs(logs, currentPage, LOGS_PER_PAGE)

  container.innerHTML = renderDetailedLoggLayout({
    logs,
    pageLogs,
    currentPage,
    totalPages,
    logsPerPage: LOGS_PER_PAGE
  })

  attachDetailedLoggEvents({
    container,
    onPageChange: (direction) => {
      if (direction === 'prev') {
        currentPage -= 1
      }

      if (direction === 'next') {
        currentPage += 1
      }
    },
    onClearLogs: () => {
      currentPage = 1
    }
  })
}
