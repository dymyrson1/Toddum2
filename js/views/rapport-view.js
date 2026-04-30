import {
  state,
  getCurrentRows,
  getCurrentWeekLabel
} from '../state.js'

export function renderRapportView(container) {
  const report = buildRapportData()

  container.innerHTML = `
    <section id="rapportTab" class="tab-panel rr-view">
      ${renderRapportHeader(report)}
      ${renderKpis(report)}
      ${renderRapportMain(report)}
      ${renderDetailTable(report)}
    </section>
  `
}

function buildRapportData() {
  const rows = getCurrentRows()
  const productMap = new Map()

  state.products.forEach(productName => {
    productMap.set(productName, {
      productName,
      totalWeightKg: 0,
      packageRows: new Map()
    })
  })

  rows.forEach(row => {
    state.products.forEach(productName => {
      const cell = row.cells?.[productName]
      const items = Array.isArray(cell?.items) ? cell.items : []

      items.forEach(item => {
        const qty = Number(item.qty) || 0
        const weightKg = Number(item.weightKg) || getFallbackWeight(item)
        const packageName = item.packageName || item.label || 'kg'
        const label = item.label || packageName

        if (qty <= 0) return

        const totalWeightKg = qty * weightKg
        const product = productMap.get(productName)

        const packageKey = `${packageName}__${weightKg}__${label}`

        if (!product.packageRows.has(packageKey)) {
          product.packageRows.set(packageKey, {
            productName,
            packageName,
            label,
            qty: 0,
            weightKg,
            totalWeightKg: 0
          })
        }

        const packageRow = product.packageRows.get(packageKey)

        packageRow.qty += qty
        packageRow.totalWeightKg += totalWeightKg
        product.totalWeightKg += totalWeightKg
      })
    })
  })

  const products = [...productMap.values()]
    .map(product => ({
      ...product,
      packageRows: [...product.packageRows.values()]
        .sort((a, b) => a.weightKg - b.weightKg)
    }))
    .filter(product => product.packageRows.length > 0)

  const totalWeightKg = products.reduce((sum, product) => {
    return sum + product.totalWeightKg
  }, 0)

  const packageLineCount = products.reduce((sum, product) => {
    return sum + product.packageRows.length
  }, 0)

  const sortedByWeight = [...products].sort((a, b) => {
    return b.totalWeightKg - a.totalWeightKg
  })

  return {
    weekLabel: getCurrentWeekLabel(),
    products,
    sortedByWeight,
    totalWeightKg,
    productCount: products.length,
    packageLineCount
  }
}

function renderRapportHeader(report) {
  return `
    <div class="rr-top">
      <div class="rr-title-card">
        <div>
          <h2>Produksjonsrapport</h2>
          <p>${escapeHtml(report.weekLabel)}</p>
        </div>
      </div>

      <div class="rr-total-card">
        <span>Total vekt</span>
        <strong>${formatKg(report.totalWeightKg)}</strong>
      </div>
    </div>
  `
}

function renderKpis(report) {
  return `
    <div class="rr-kpis">
      <div class="rr-kpi">
        <span>Produkter</span>
        <strong>${report.productCount}</strong>
      </div>

      <div class="rr-kpi">
        <span>Emballasjelinjer</span>
        <strong>${report.packageLineCount}</strong>
      </div>

      <div class="rr-kpi">
        <span>Total vekt</span>
        <strong>${formatKg(report.totalWeightKg)}</strong>
      </div>
    </div>
  `
}

function renderRapportMain(report) {
  if (report.products.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen produksjonsdata for denne uken.
      </div>
    `
  }

  return `
    <div class="rr-grid">
      <section class="rr-card">
        <div class="rr-card-head">
          <h3>Produksjonsliste</h3>
          <span>Kort oversikt for produksjon</span>
        </div>

        <div class="rr-production-list">
          ${report.products.map(renderProductionItem).join('')}
        </div>
      </section>

      <section class="rr-card">
        <div class="rr-card-head">
          <h3>Sum per produkt</h3>
          <span>Sortert etter total vekt</span>
        </div>

        <div class="rr-table-wrap">
          <table class="rr-table rr-table-summary">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Linjer</th>
                <th>Total vekt</th>
              </tr>
            </thead>

            <tbody>
              ${report.sortedByWeight.map(product => `
                <tr>
                  <td><strong>${escapeHtml(product.productName)}</strong></td>
                  <td>${product.packageRows.length}</td>
                  <td>${formatKg(product.totalWeightKg)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `
}

function renderProductionItem(product) {
  return `
    <article class="rr-production-item">
      <div class="rr-production-top">
        <strong>${escapeHtml(product.productName)}</strong>
        <span>${formatKg(product.totalWeightKg)}</span>
      </div>

      <div class="rr-production-body">
        ${product.packageRows.map(formatPackageShort).join(', ')}
      </div>
    </article>
  `
}

function renderDetailTable(report) {
  if (report.products.length === 0) {
    return ''
  }

  return `
    <section class="rr-card rr-card-full">
      <div class="rr-card-head">
        <h3>Detaljert oversikt</h3>
        <span>Alle emballasjer per produkt</span>
      </div>

      <div class="rr-table-wrap">
        <table class="rr-table rr-table-detail">
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
    .map((packageRow, index) => `
      <tr>
        <td class="rr-product-name-cell">
          ${index === 0 ? `<strong>${escapeHtml(product.productName)}</strong>` : ''}
        </td>
        <td>${escapeHtml(formatPackageLabel(packageRow))}</td>
        <td>${escapeHtml(formatPackageQty(packageRow))}</td>
        <td>${escapeHtml(formatUnitWeight(packageRow))}</td>
        <td>${formatKg(packageRow.totalWeightKg)}</td>
      </tr>
    `)
    .join('')

  return `
    ${packageRows}

    <tr class="rr-subtotal-row">
      <td><strong>Sum ${escapeHtml(product.productName)}</strong></td>
      <td></td>
      <td></td>
      <td></td>
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

function getFallbackWeight(item) {
  const label = String(item.label || item.packageName || '').toLowerCase()

  if (label.includes('125g')) return 0.125
  if (label.includes('10g')) return 0.01
  if (label.includes('250g')) return 0.25
  if (label.includes('500g')) return 0.5
  if (label.includes('3kg')) return 3
  if (label.includes('5kg')) return 5
  if (label.includes('8kg')) return 8
  if (label === 'l') return 1
  if (label === 'kg') return 1

  return 1
}

function formatKg(value) {
  return `${formatNumber(value)} kg`
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}