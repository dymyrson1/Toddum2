import { escapeHtml } from '../utils/html.js'
import { getPercent } from './analytics-data.js'

export function renderProgressSection(data) {
  const packedPercent = getPercent(data.packedCount, data.orderRowsCount)
  const deliveredPercent = getPercent(data.deliveredCount, data.orderRowsCount)

  return `
    <section class="analytics-card">
      <div class="analytics-card-header">
        <h3>Fremdrift</h3>
        <span>Status for pakking og levering</span>
      </div>

      <div class="analytics-progress-list">
        ${renderProgressRow('Pakket', data.packedCount, data.orderRowsCount, packedPercent)}
        ${renderProgressRow('Levert', data.deliveredCount, data.orderRowsCount, deliveredPercent)}
      </div>
    </section>
  `
}

function renderProgressRow(label, current, total, percent) {
  return `
    <div class="analytics-progress-row">
      <div class="analytics-progress-info">
        <strong>${escapeHtml(label)}</strong>
        <span>${current}/${total} · ${percent}%</span>
      </div>

      <div class="analytics-progress-track">
        <div class="analytics-progress-fill" style="width: ${percent}%"></div>
      </div>
    </div>
  `
}
