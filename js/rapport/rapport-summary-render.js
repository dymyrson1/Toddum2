import { escapeHtml } from '../utils/html.js'

import { formatKg, formatPackageShort } from './rapport-formatters.js'

export function renderRapportMain(report) {
  if (report.products.length === 0) {
    return `
      <section class="rapport-card">
        <div class="rapport-empty">
          Ingen produksjonsdata for denne uken.
        </div>
      </section>
    `
  }

  return `
    <div class="rapport-layout">
      <section class="rapport-card">
        <div class="rapport-card-header">
          <h3>Produksjonsliste</h3>
          <span>Kort oversikt for produksjon</span>
        </div>

        <div class="rapport-production-list">
          ${report.products.map(renderProductionItem).join('')}
        </div>
      </section>

      <section class="rapport-card">
        <div class="rapport-card-header">
          <h3>Sum per produkt</h3>
          <span>Sortert etter total vekt</span>
        </div>

        <div class="rapport-table-wrap">
          <table class="rapport-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Linjer</th>
                <th>Total vekt</th>
              </tr>
            </thead>

            <tbody>
              ${report.sortedByWeight.map(renderProductSummaryRow).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `
}

function renderProductionItem(product) {
  return `
    <article class="rapport-production-item">
      <div>
        <strong>${escapeHtml(product.productName)}</strong>
        <span>${formatKg(product.totalWeightKg)}</span>
      </div>

      <p>${product.packageRows.map(formatPackageShort).join(', ')}</p>
    </article>
  `
}

function renderProductSummaryRow(product) {
  return `
    <tr>
      <td>${escapeHtml(product.productName)}</td>
      <td>${product.packageRows.length}</td>
      <td>${formatKg(product.totalWeightKg)}</td>
    </tr>
  `
}
