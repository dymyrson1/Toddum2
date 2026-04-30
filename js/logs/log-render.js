import { escapeHtml } from '../utils/html.js'

import {
  formatLogObject,
  getActionType,
  getLogDetails,
  getPaginationRange
} from './log-data.js'

export function renderLoggLayout(logs) {
  return `
    <section id="loggTab" class="tab-panel logg-view">
      <div class="logg-header">
        <div>
          <h2>Endringslogg</h2>
          <p>Viser de siste endringene i systemet.</p>
        </div>

        <button id="clearLogsBtn" class="secondary-btn" type="button">
          Tøm logg
        </button>
      </div>

      ${renderLogCards(logs)}
    </section>
  `
}

export function renderDetailedLoggLayout({
  logs,
  pageLogs,
  currentPage,
  totalPages,
  logsPerPage
}) {
  return `
    <section id="loggDetaljertTab" class="tab-panel logg-detaljert-view">
      <div class="logg-header">
        <div>
          <h2>Detaljert endringslogg</h2>
          <p>${logs.length} registrerte endringer</p>
        </div>

        <button id="clearDetailedLogsBtn" class="secondary-btn" type="button">
          Tøm logg
        </button>
      </div>

      ${renderDetailedLogTable(pageLogs)}
      ${renderPagination({
        totalItems: logs.length,
        currentPage,
        totalPages,
        logsPerPage
      })}
    </section>
  `
}

function renderLogCards(logs) {
  if (logs.length === 0) {
    return `
      <div class="settings-empty">
        Ingen loggførte endringer ennå.
      </div>
    `
  }

  return `
    <div class="logg-list">
      ${logs.map(renderLogCard).join('')}
    </div>
  `
}

function renderLogCard(log) {
  return `
    <article class="logg-card">
      <div class="logg-card-header">
        <strong>${escapeHtml(log.actionLabel || log.action || 'Endring')}</strong>
        <span>
          ${escapeHtml(formatDateTime(log.createdAt))}
          ${log.weekLabel ? ` · ${escapeHtml(log.weekLabel)}` : ''}
        </span>
      </div>

      ${renderLogDetails(log)}
    </article>
  `
}

function renderLogDetails(log) {
  const details = getLogDetails(log)

  if (details.length === 0) return ''

  return `
    <dl class="logg-details">
      ${details
        .map(
          (detail) => `
            <div>
              <dt>${escapeHtml(detail.label)}</dt>
              <dd>${escapeHtml(detail.value)}</dd>
            </div>
          `
        )
        .join('')}
    </dl>
  `
}

function renderDetailedLogTable(logs) {
  if (logs.length === 0) {
    return `
      <div class="settings-empty">
        Ingen endringer ennå.
      </div>
    `
  }

  return `
    <div class="logg-table-wrap">
      <table class="logg-table">
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
          ${logs.map(renderDetailedLogRow).join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderDetailedLogRow(log) {
  return `
    <tr>
      <td>${escapeHtml(formatDetailedDateTime(log.createdAt))}</td>
      <td>${escapeHtml(log.weekLabel || '—')}</td>
      <td>${renderTypeBadge(log.action)}</td>
      <td>${escapeHtml(log.actionLabel || log.action || 'Endring')}</td>
      <td>${escapeHtml(formatLogObject(log))}</td>
      <td>${escapeHtml(log.oldValue || '—')}</td>
      <td>${escapeHtml(log.newValue || '—')}</td>
    </tr>
  `
}

function renderTypeBadge(action) {
  const type = getActionType(action)

  return `
    <span class="log-type-badge ${escapeHtml(type.className)}">
      ${escapeHtml(type.label)}
    </span>
  `
}

function renderPagination({ totalItems, currentPage, totalPages, logsPerPage }) {
  if (totalItems <= logsPerPage) return ''

  const range = getPaginationRange(totalItems, currentPage, logsPerPage)

  return `
    <div class="logg-pagination">
      <span>Viser ${range.from}–${range.to} av ${totalItems}</span>

      <div>
        <button
          type="button"
          data-detailed-log-page="prev"
          ${currentPage <= 1 ? 'disabled' : ''}
        >
          ‹
        </button>

        <strong>${currentPage} / ${totalPages}</strong>

        <button
          type="button"
          data-detailed-log-page="next"
          ${currentPage >= totalPages ? 'disabled' : ''}
        >
          ›
        </button>
      </div>
    </div>
  `
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

function formatDetailedDateTime(value) {
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
