import { state, clearLogs } from '../state.js'
import { renderTab } from '../tabs/tabs-render.js'

export function renderLoggView(container) {
  const logs = [...(state.logs || [])].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  container.innerHTML = `
    <section id="loggTab" class="tab-panel">
      <div class="logg-header">
        <div>
          <h2>Endringslogg</h2>
          <div class="muted-text">
            Viser de siste endringene i systemet.
          </div>
        </div>

        <button id="clearLogsBtn" class="danger-btn" ${logs.length === 0 ? 'disabled' : ''}>
          Tøm logg
        </button>
      </div>

      ${renderLogs(logs)}
    </section>
  `

  attachLoggEvents()
}

function renderLogs(logs) {
  if (logs.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen loggførte endringer ennå.
      </div>
    `
  }

  return `
    <div class="logg-list">
      ${logs
        .map(
          (log) => `
        <article class="logg-item">
          <div class="logg-item-main">
            <div class="logg-action">${escapeHtml(log.actionLabel || log.action || 'Endring')}</div>
            <div class="logg-meta">
              ${escapeHtml(formatDateTime(log.createdAt))}
              ${log.weekLabel ? ` · ${escapeHtml(log.weekLabel)}` : ''}
            </div>
          </div>

          ${renderLogDetails(log)}
        </article>
      `
        )
        .join('')}
    </div>
  `
}

function renderLogDetails(log) {
  const details = []

  if (log.customerName) {
    details.push(['Kunde', log.customerName])
  }

  if (log.deliveryDay) {
    details.push(['Leveringsdag', log.deliveryDay])
  }

  if (log.productName) {
    details.push(['Produkt', log.productName])
  }

  if (log.oldValue || log.newValue) {
    details.push(['Før', log.oldValue || '—'])
    details.push(['Etter', log.newValue || '—'])
  }

  if (log.note) {
    details.push(['Notat', log.note])
  }

  if (details.length === 0) {
    return ''
  }

  return `
    <dl class="logg-details">
      ${details
        .map(
          ([label, value]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `
        )
        .join('')}
    </dl>
  `
}

function attachLoggEvents() {
  const clearButton = document.getElementById('clearLogsBtn')
  if (!clearButton) return

  clearButton.onclick = () => {
    const confirmed = confirm('Vil du tømme hele endringsloggen?')
    if (!confirmed) return

    clearLogs()
    renderTab()
  }
}

function formatDateTime(value) {
  if (!value) return 'Ukjent tidspunkt'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Ukjent tidspunkt'
  }

  return date.toLocaleString('nb-NO', {
    dateStyle: 'short',
    timeStyle: 'short'
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
