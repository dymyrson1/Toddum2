import { escapeHtml } from '../utils/html.js'
import { formatKg } from './rapport-formatters.js'

export function renderRapportHeader(report) {
  return `
    <div class="rapport-hero">
      <div>
        <h2>Produksjonsrapport</h2>
        <p>${escapeHtml(report.weekLabel)}</p>
      </div>

      <div class="rapport-main-number">
        <span>Total vekt</span>
        <strong>${formatKg(report.totalWeightKg)}</strong>
      </div>
    </div>
  `
}

export function renderRapportKpis(report) {
  return `
    <div class="rapport-kpi-grid">
      ${renderKpiCard('Produkter', report.productCount)}
      ${renderKpiCard('Emballasjelinjer', report.packageLineCount)}
      ${renderKpiCard('Total vekt', formatKg(report.totalWeightKg))}
    </div>
  `
}

function renderKpiCard(label, value) {
  return `
    <div class="rapport-kpi-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `
}
