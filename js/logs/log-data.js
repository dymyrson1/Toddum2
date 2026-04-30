export const LOGS_PER_PAGE = 10

export function sortLogsByDate(logs = []) {
  return [...logs].sort((a, b) => {
    return getTimeValue(b.createdAt) - getTimeValue(a.createdAt)
  })
}

export function getLogDetails(log) {
  const details = []

  if (log.customerName) {
    details.push({
      label: 'Kunde',
      value: log.customerName
    })
  }

  if (log.deliveryDay) {
    details.push({
      label: 'Leveringsdag',
      value: log.deliveryDay
    })
  }

  if (log.productName) {
    details.push({
      label: 'Produkt',
      value: log.productName
    })
  }

  if (log.oldValue || log.newValue) {
    details.push({
      label: 'Før',
      value: log.oldValue || '—'
    })

    details.push({
      label: 'Etter',
      value: log.newValue || '—'
    })
  }

  if (log.note) {
    details.push({
      label: 'Notat',
      value: log.note
    })
  }

  return details
}

export function formatLogObject(log) {
  const parts = []

  if (log.customerName) {
    parts.push(log.customerName)
  }

  if (log.deliveryDay) {
    parts.push(log.deliveryDay)
  }

  if (log.productName) {
    parts.push(log.productName)
  }

  return parts.length ? parts.join(' · ') : '—'
}

export function getActionType(action = '') {
  if (action.includes('add')) {
    return {
      label: 'Ny',
      className: 'is-add'
    }
  }

  if (action.includes('delete') || action.includes('remove')) {
    return {
      label: 'Slettet',
      className: 'is-delete'
    }
  }

  if (action.includes('update') || action.includes('move')) {
    return {
      label: 'Endret',
      className: 'is-update'
    }
  }

  return {
    label: 'Logg',
    className: 'is-neutral'
  }
}

export function getTotalLogPages(totalItems, logsPerPage = LOGS_PER_PAGE) {
  return Math.max(1, Math.ceil(totalItems / logsPerPage))
}

export function clampLogPage(page, totalPages) {
  return Math.min(Math.max(page, 1), totalPages)
}

export function getPagedLogs(logs, page, logsPerPage = LOGS_PER_PAGE) {
  const start = (page - 1) * logsPerPage
  const end = start + logsPerPage

  return logs.slice(start, end)
}

export function getPaginationRange(totalItems, page, logsPerPage = LOGS_PER_PAGE) {
  if (totalItems === 0) {
    return {
      from: 0,
      to: 0
    }
  }

  return {
    from: (page - 1) * logsPerPage + 1,
    to: Math.min(page * logsPerPage, totalItems)
  }
}

function getTimeValue(value) {
  const date = new Date(value)
  const time = date.getTime()

  if (Number.isNaN(time)) return 0

  return time
}
