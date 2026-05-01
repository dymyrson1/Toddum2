import { escapeHtml } from '../utils/html.js'

import {
  formatKg,
  formatPackageLabel,
  formatPackageQty,
  formatUnitWeight
} from './rapport-formatters.js'

export function renderRapportDetailTable(report) {
  if (report.products.length === 0) return ''

  return `
    <section class="rapport-card rapport-card-wide">
      <div class="rapport-card-header">
        <h3>Detaljert oversikt</h3>
        <span>Alle emballasjer per produkt</span>
      </div>

      <div class="rapport-table-wrap">
        <table class="rapport-table">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Emballasje</th>
              <th>Antall</th>
              <th>Enhetsvekt</th>
              <th>Total vekt</th>
            </tr>
          </thead>

          <tbody>
            ${report.products.map(renderProductDetailRows).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function renderProductDetailRows(product) {
  const packageRows = product.packageRows
    .map((packageRow, index) => {
      return `
        <tr>
          <td>${index === 0 ? escapeHtml(product.productName) : ''}</td>
          <td>${escapeHtml(formatPackageLabel(packageRow))}</td>
          <td>${escapeHtml(formatPackageQty(packageRow))}</td>
          <td>${escapeHtml(formatUnitWeight(packageRow))}</td>
          <td>${formatKg(packageRow.totalWeightKg)}</td>
        </tr>
      `
    })
    .join('')

  return `
    ${packageRows}
    <tr class="rapport-total-row">
      <td colspan="4">Sum ${escapeHtml(product.productName)}</td>
      <td>${formatKg(product.totalWeightKg)}</td>
    </tr>
  `
}
