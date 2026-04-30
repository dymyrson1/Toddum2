import { escapeHtml } from '../utils/html.js'
import { formatNumber } from '../utils/number.js'

export function renderRapportLayout(report) {
  return `
    <section id="rapportTab" class="tab-panel rapport-view">
      ${renderRapportHeader(report)}
      ${renderKpis(report)}
      ${renderRapportMain(report)}
      ${renderDetailTable(report)}
    </section>
  `
}

function renderRapportHeader(report) {
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

function renderKpis(report) {
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

function renderRapportMain(report) {
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

function renderDetailTable(report) {
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

function formatPackageShort(packageRow) {
  const qty = formatNumber(packageRow.qty)
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || packageRow.packageName || '')

  if (packageName === 'kg' || label.toLowerCase() === 'kg') {
    return `${qty}kg`
  }

  if (packageName === 'l' || label.toLowerCase() === 'l') {
    return `${qty}l`
  }

  if (packageName.includes('spann') || label.toLowerCase().includes('spann')) {
    return `${qty} spann`
  }

  return `${qty}×${escapeHtml(label)}`
}

function formatPackageLabel(packageRow) {
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = packageRow.label || packageRow.packageName

  if (packageName.includes('spann')) {
    return `spann - ${formatNumber(packageRow.weightKg)} kg`
  }

  return label
}

function formatPackageQty(packageRow) {
  const qty = formatNumber(packageRow.qty)
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || '').toLowerCase()

  if (packageName === 'kg' || label === 'kg') {
    return `${qty} kg`
  }

  if (packageName === 'l' || label === 'l') {
    return `${qty} l`
  }

  if (packageName.includes('spann') || label.includes('spann')) {
    return `${qty} spann`
  }

  return `${qty} stk`
}

function formatUnitWeight(packageRow) {
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || '').toLowerCase()

  if (packageName === 'l' || label === 'l') {
    return `${formatNumber(packageRow.weightKg)} l`
  }

  if (packageRow.weightKg < 1) {
    return `${formatNumber(packageRow.weightKg * 1000)} g`
  }

  return `${formatNumber(packageRow.weightKg)} kg`
}

function formatKg(value) {
  return `${formatNumber(value)} kg`
}
