#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Remove simple Logg render/event code while keeping Detaljert logg"
echo ""

FILES=(
  "js/views/logg-view.js"
  "js/logs/log-render.js"
  "js/logs/log-events.js"
)

echo "Planned changes:"
echo "- delete if exists: js/views/logg-view.js"
echo "- update: js/logs/log-render.js"
echo "- update: js/logs/log-events.js"
echo "- keep: js/views/logg-detaljert-view.js"
echo "- keep: js/logs/log-data.js"
echo "- keep: js/logs/log-state.js"
echo "- keep: state.logs / addLog / clearLogs"
echo "- keep: css/logg.css"

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/remove-simple-log-render-code.sh --write"
  echo ""
  exit 0
fi

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

rm -f js/views/logg-view.js

cat > js/logs/log-render.js <<'JS'
import { escapeHtml } from '../utils/html.js'

import {
  formatLogObject,
  getActionType,
  getPaginationRange
} from './log-data.js'

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
JS

cat > js/logs/log-events.js <<'JS'
import { renderTab } from '../tabs/tabs-render.js'
import { clearLogsFromState } from './log-state.js'

export function attachDetailedLoggEvents({
  container,
  onPageChange,
  onClearLogs
}) {
  container.onclick = event => {
    const clearButton = event.target.closest('#clearDetailedLogsBtn')

    if (clearButton) {
      const confirmed = confirm('Vil du tømme hele endringsloggen?')

      if (!confirmed) return

      onClearLogs()
      clearLogsFromState()
      renderTab()
      return
    }

    const pageButton = event.target.closest('[data-detailed-log-page]')

    if (!pageButton) return

    onPageChange(pageButton.dataset.detailedLogPage)
    renderTab()
  }
}
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
