import { state, clearLogs } from '../state.js'
import { renderTab } from '../tabs/tabs-render.js'

const LOGS_PER_PAGE = 10

let currentPage = 1

export function renderLoggDetaljertView(container) {
  const logs = getSortedLogs()
  const totalPages = getTotalPages(logs.length)

  currentPage = clampPage(currentPage, totalPages)

  const pageLogs = getPageLogs(logs, currentPage)

  container.innerHTML = `
    <section id="loggDetaljertTab" class="tab-panel">
      <div class="pro-log-header">
        <div>
          <h2>Detaljert endringslogg</h2>
          <p>${logs.length} registrerte endringer</p>
        </div>

        <button id="clearDetailedLogsBtn" class="danger-btn compact" ${logs.length === 0 ? 'disabled' : ''}>
          Tøm logg
        </button>
      </div>

      ${renderLogTable(pageLogs)}
      ${renderPagination(logs.length, totalPages)}
    </section>
  `

  attachEvents()
}

function getSortedLogs() {
  return [...(state.logs || [])].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

function getTotalPages(totalItems) {
  return Math.max(1, Math.ceil(totalItems / LOGS_PER_PAGE))
}

function clampPage(page, totalPages) {
  return Math.min(Math.max(page, 1), totalPages)
}

function getPageLogs(logs, page) {
  const start = (page - 1) * LOGS_PER_PAGE
  const end = start + LOGS_PER_PAGE

  return logs.slice(start, end)
}

function renderLogTable(logs) {
  if (logs.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen endringer ennå.
      </div>
    `
  }

  return `
    <div class="pro-log-table-wrap">
      <table class="pro-log-table">
        <thead>
          <tr>
            <th>Tidspunkt</th>
            <th>Uke</th>
            <th>Type</th>
            <th>Handling</th>
            <th>Objekt</th>
            <th>Før</th>
            <th>Etter</th>
          </tr>
        </thead>

        <tbody>
          ${logs.map(log => `
            <tr>
              <td class="pro-log-muted">${escapeHtml(formatDateTime(log.createdAt))}</td>
              <td class="pro-log-muted">${escapeHtml(log.weekLabel || '—')}</td>
              <td>${renderTypeBadge(log.action)}</td>
              <td>
                <strong>${escapeHtml(log.actionLabel || log.action || 'Endring')}</strong>
              </td>
              <td>${escapeHtml(formatObject(log))}</td>
              <td class="pro-log-before">${escapeHtml(log.oldValue || '—')}</td>
              <td class="pro-log-after">${escapeHtml(log.newValue || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderPagination(totalItems, totalPages) {
  if (totalItems <= LOGS_PER_PAGE) {
    return ''
  }

  const from = (currentPage - 1) * LOGS_PER_PAGE + 1
  const to = Math.min(currentPage * LOGS_PER_PAGE, totalItems)

  return `
    <div class="log-pagination">
      <div class="log-pagination-info">
        Viser ${from}–${to} av ${totalItems}
      </div>

      <div class="log-pagination-nav">
        <button
          class="log-page-btn"
          data-detailed-log-page="prev"
          aria-label="Forrige side"
          title="Forrige side"
          ${currentPage === 1 ? 'disabled' : ''}
        >
          <span>‹</span>
        </button>

        <div class="log-page-indicator">
          <strong>${currentPage}</strong>
          <span>/ ${totalPages}</span>
        </div>

        <button
          class="log-page-btn"
          data-detailed-log-page="next"
          aria-label="Neste side"
          title="Neste side"
          ${currentPage === totalPages ? 'disabled' : ''}
        >
          <span>›</span>
        </button>
      </div>
    </div>
  `
}

function formatObject(log) {
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

function renderTypeBadge(action) {
  const type = getActionType(action)

  return `
    <span class="pro-log-badge ${type.className}">
      ${escapeHtml(type.label)}
    </span>
  `
}

function getActionType(action = '') {
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

function attachEvents() {
  const clearButton = document.getElementById('clearDetailedLogsBtn')

  if (clearButton) {
    clearButton.onclick = () => {
      const confirmed = confirm('Vil du tømme hele endringsloggen?')
      if (!confirmed) return

      currentPage = 1
      clearLogs()
      renderTab()
    }
  }

  document.querySelectorAll('[data-detailed-log-page]').forEach(button => {
    button.onclick = () => {
      const action = button.dataset.detailedLogPage

      if (action === 'prev') {
        currentPage--
      }

      if (action === 'next') {
        currentPage++
      }

      renderTab()
    }
  })
}

function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}