import {
  getRapportData,
  formatWeightKg,
  formatPackageLine
} from '../rapport/rapport.js'

export function renderRapportView(container) {
  const data = getRapportData()

  container.innerHTML = `
    <section id="rapportTab" class="tab-panel">
      <div class="rapport-header">
        <div>
          <h2>Produksjonsrapport</h2>
          <div class="muted-text">Uke: <strong>${escapeHtml(data.weekId)}</strong></div>
        </div>
      </div>

      <div class="rapport-summary-grid">
        <div class="rapport-card">
          <span>Produkter</span>
          <strong>${data.products.length}</strong>
        </div>

        <div class="rapport-card">
          <span>Ordrelinjer</span>
          <strong>${data.totalOrderLines}</strong>
        </div>

        <div class="rapport-card">
          <span>Total vekt</span>
          <strong>${formatWeightKg(data.totalWeight)}</strong>
        </div>
      </div>

      <div class="rapport-section">
        <h3>Dette må produseres</h3>
        ${renderProductionSummary(data)}
      </div>
    </section>
  `
}

function renderProductionSummary(data) {
  if (data.products.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen produksjonsdata for denne uken.
      </div>
    `
  }

  return `
    <div class="rapport-products">
      ${data.products.map(product => `
        <div class="rapport-product-card">
          <div class="rapport-product-header">
            <h4>${escapeHtml(product.productName)}</h4>
            <strong>${formatWeightKg(product.totalWeight)}</strong>
          </div>

          <div class="rapport-package-list">
            ${product.packages.map(packageEntry => `
              <div class="rapport-package-row">
                <span>${escapeHtml(formatPackageLine(packageEntry))}</span>
                <strong>${formatWeightKg(packageEntry.totalWeight)}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}