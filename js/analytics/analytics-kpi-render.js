import { escapeHtml } from '../utils/html.js'

export function renderKpiGrid(data) {
  return `
    <div class="analytics-kpi-grid">
      ${renderKpiCard('Kunder med ordre', data.orderRowsCount)}
      ${renderKpiCard('Ordrelinjer', data.orderLineCount)}
      ${renderKpiCard('Pakket', `${data.packedCount}/${data.orderRowsCount}`)}
      ${renderKpiCard('Levert', `${data.deliveredCount}/${data.orderRowsCount}`)}
      ${renderKpiCard('Ikke pakket', data.notPackedCount)}
      ${renderKpiCard('Ikke levert', data.notDeliveredCount)}
    </div>
  `
}

function renderKpiCard(label, value) {
  return `
    <div class="analytics-kpi-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `
}
