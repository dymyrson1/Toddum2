import { state, clearLogs } from '../state.js'
import { renderTab } from '../tabs/tabs-render.js'

export function renderLoggDetaljertView(container) {
  const logs = [...(state.logs || [])].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

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

      ${renderLogTable(logs)}
    </section>
  `

  attachEvents()
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

  if (action.includes('update')) {
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
  if (!clearButton) return

  clearButton.onclick = () => {
    const confirmed = confirm('Vil du tømme hele endringsloggen?')
    if (!confirmed) return

    clearLogs()
    renderTab()
  }
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