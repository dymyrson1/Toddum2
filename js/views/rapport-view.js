import {
  getRapportData,
  formatNumber,
  formatWeightKg,
  formatPackageLine
} from '../rapport/rapport.js'

export function renderRapportView(container) {
  const data = getRapportData()

  container.innerHTML = `
    <section id="rapportTab" class="tab-panel rapport-panel">
      <div class="rapport-hero">
        <div>
          <h2>Produksjonsrapport</h2>
          <p>${escapeHtml(formatUke(data.weekId))}</p>
        </div>

        <div class="rapport-total-weight">
          <span>Total vekt</span>
          <strong>${formatWeightKg(data.totalWeight)}</strong>
        </div>
      </div>

      <div class="rapport-kpi-grid">
        <div class="rapport-kpi">
          <span>Produkter</span>
          <strong>${data.products.length}</strong>
        </div>

        <div class="rapport-kpi">
          <span>Ordrelinjer</span>
          <strong>${data.totalOrderLines}</strong>
        </div>

        <div class="rapport-kpi">
          <span>Total vekt</span>
          <strong>${formatWeightKg(data.totalWeight)}</strong>
        </div>
      </div>

      <div class="rapport-section clean">
        <div class="rapport-section-header">
          <h3>Produktoversikt</h3>
          <span>Hva som må produseres denne uken</span>
        </div>

        ${renderProductionTable(data)}
      </div>

      <div class="rapport-section clean">
        <div class="rapport-section-header">
          <h3>Sammendrag per produkt</h3>
          <span>Total vekt per produkt</span>
        </div>

        ${renderProductSummary(data)}
      </div>
    </section>
  `
}

function renderProductionTable(data) {
  if (data.products.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen produksjonsdata for denne uken.
      </div>
    `
  }

  const rows = data.products.flatMap(product => {
    return product.packages.map(packageEntry => ({
      productName: product.productName,
      packageEntry
    }))
  })

  return `
    <div class="rapport-table-wrap">
      <table class="rapport-production-table">
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
          ${rows.map(row => `
            <tr>
              <td>
                <strong>${escapeHtml(row.productName)}</strong>
              </td>
              <td>${escapeHtml(formatPackageName(row.packageEntry))}</td>
              <td>${escapeHtml(formatAmount(row.packageEntry))}</td>
              <td>${escapeHtml(formatUnitWeight(row.packageEntry))}</td>
              <td>
                <strong>${formatWeightKg(row.packageEntry.totalWeight)}</strong>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderProductSummary(data) {
  if (data.products.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen produkter å vise.
      </div>
    `
  }

  return `
    <div class="rapport-summary-list">
      ${data.products.map(product => `
        <div class="rapport-summary-row">
          <div>
            <strong>${escapeHtml(product.productName)}</strong>
            <span>${product.packages.length} emballasjetyper</span>
          </div>

          <strong>${formatWeightKg(product.totalWeight)}</strong>
        </div>
      `).join('')}
    </div>
  `
}

function formatAmount(packageEntry) {
  if (packageEntry.packageName.toLowerCase() === 'kg') {
    return `${formatNumber(packageEntry.qty)} kg`
  }

  if (packageEntry.packageName.toLowerCase().includes('spann')) {
    return `${formatNumber(packageEntry.qty)} spann`
  }

  return `${formatNumber(packageEntry.qty)} stk`
}

function formatPackageName(packageEntry) {
  if (packageEntry.packageName.toLowerCase() === 'kg') {
    return 'Løs vekt'
  }

  return packageEntry.label
}

function formatUnitWeight(packageEntry) {
  if (packageEntry.packageName.toLowerCase() === 'kg') {
    return '1 kg'
  }

  return formatWeightKg(packageEntry.weightKg)
}

function formatUke(weekId) {
  const match = String(weekId).match(/W(\d+)$/)
  return match ? `Uke ${Number(match[1])}` : weekId
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}