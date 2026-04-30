import {
  state,
  getCurrentRows,
  getCurrentWeekLabel
} from '../state.js'

export function renderAnalyticsView(container) {
  const analytics = buildAnalyticsData()

  container.innerHTML = `
    <section id="analyticsTab" class="tab-panel analytics-view">
      <div class="analytics-hero">
        <div>
          <h2>Analytics</h2>
          <p>${escapeHtml(analytics.weekLabel)}</p>
        </div>

        <div class="analytics-main-number">
          <span>Total vekt</span>
          <strong>${formatKg(analytics.totalWeightKg)}</strong>
        </div>
      </div>

      ${renderKpiGrid(analytics)}
      ${renderProgressSection(analytics)}

      <div class="analytics-layout">
        ${renderDeliveryDaySection(analytics)}
        ${renderTopCustomersSection(analytics)}
      </div>

      <div class="analytics-layout">
        ${renderTopProductsSection(analytics)}
        ${renderProblemsSection(analytics)}
      </div>
    </section>
  `
}

function buildAnalyticsData() {
  const rows = getCurrentRows()
  const orderRows = rows.filter(hasOrderContent)

  const customerStats = new Map()
  const productStats = new Map()
  const deliveryDayStats = new Map()

  const problems = {
    missingCustomer: [],
    missingDeliveryDay: [],
    notPacked: [],
    notDelivered: [],
    packedNotDelivered: []
  }

  let totalWeightKg = 0
  let orderLineCount = 0
  let packedCount = 0
  let deliveredCount = 0

  orderRows.forEach(row => {
    const customerName = row.customerName || 'Uten kunde'
    const deliveryDay = row.deliveryDay || 'Uten leveringsdag'
    const rowWeightKg = getRowWeight(row)
    const rowLineCount = getRowLineCount(row)

    totalWeightKg += rowWeightKg
    orderLineCount += rowLineCount

    if (row.checks?.A) packedCount++
    if (row.checks?.B) deliveredCount++

    addCustomerStat(customerStats, customerName, rowWeightKg, rowLineCount)
    addDeliveryDayStat(deliveryDayStats, deliveryDay, rowWeightKg, rowLineCount)

    addProductStats(productStats, row)

    if (!row.customerName) {
      problems.missingCustomer.push(row)
    }

    if (!row.deliveryDay) {
      problems.missingDeliveryDay.push(row)
    }

    if (!row.checks?.A) {
      problems.notPacked.push(row)
    }

    if (!row.checks?.B) {
      problems.notDelivered.push(row)
    }

    if (row.checks?.A && !row.checks?.B) {
      problems.packedNotDelivered.push(row)
    }
  })

  const customerList = [...customerStats.values()]
    .sort((a, b) => b.totalWeightKg - a.totalWeightKg)

  const productList = [...productStats.values()]
    .sort((a, b) => b.totalWeightKg - a.totalWeightKg)

  const deliveryDayList = sortDeliveryDays([...deliveryDayStats.values()])

  return {
    weekLabel: getCurrentWeekLabel(),
    totalRows: rows.length,
    orderRowsCount: orderRows.length,
    orderLineCount,
    totalWeightKg,
    packedCount,
    deliveredCount,
    notPackedCount: orderRows.length - packedCount,
    notDeliveredCount: orderRows.length - deliveredCount,
    customerList,
    productList,
    deliveryDayList,
    problems
  }
}

function renderKpiGrid(data) {
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

function renderProgressSection(data) {
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

function renderDeliveryDaySection(data) {
  return `
    <section class="analytics-card">
      <div class="analytics-card-header">
        <h3>Levering per dag</h3>
        <span>Antall kunder og total vekt</span>
      </div>

      ${
        data.deliveryDayList.length === 0
          ? renderEmpty('Ingen leveringsdata.')
          : `
            <div class="analytics-table-wrap">
              <table class="analytics-table">
                <thead>
                  <tr>
                    <th>Dag</th>
                    <th>Kunder</th>
                    <th>Linjer</th>
                    <th>Vekt</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.deliveryDayList.map(day => `
                    <tr>
                      <td><strong>${escapeHtml(day.deliveryDay)}</strong></td>
                      <td>${day.customerCount}</td>
                      <td>${day.orderLineCount}</td>
                      <td>${formatKg(day.totalWeightKg)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
      }
    </section>
  `
}

function renderTopCustomersSection(data) {
  const topCustomers = data.customerList.slice(0, 10)

  return `
    <section class="analytics-card">
      <div class="analytics-card-header">
        <h3>Topp kunder</h3>
        <span>Sortert etter total vekt</span>
      </div>

      ${
        topCustomers.length === 0
          ? renderEmpty('Ingen kunder med ordre.')
          : `
            <div class="analytics-rank-list">
              ${topCustomers.map((customer, index) => renderRankRow({
                rank: index + 1,
                title: customer.customerName,
                meta: `${customer.orderLineCount} ordrelinjer`,
                value: formatKg(customer.totalWeightKg)
              })).join('')}
            </div>
          `
      }
    </section>
  `
}

function renderTopProductsSection(data) {
  const topProducts = data.productList.slice(0, 10)

  return `
    <section class="analytics-card">
      <div class="analytics-card-header">
        <h3>Topp produkter</h3>
        <span>Sortert etter total vekt</span>
      </div>

      ${
        topProducts.length === 0
          ? renderEmpty('Ingen produkter med ordre.')
          : `
            <div class="analytics-rank-list">
              ${topProducts.map((product, index) => renderRankRow({
                rank: index + 1,
                title: product.productName,
                meta: `${product.orderLineCount} ordrelinjer`,
                value: formatKg(product.totalWeightKg)
              })).join('')}
            </div>
          `
      }
    </section>
  `
}

function renderProblemsSection(data) {
  const problemRows = [
    {
      label: 'Mangler kunde',
      count: data.problems.missingCustomer.length,
      severity: 'danger'
    },
    {
      label: 'Mangler leveringsdag',
      count: data.problems.missingDeliveryDay.length,
      severity: 'warning'
    },
    {
      label: 'Ikke pakket',
      count: data.problems.notPacked.length,
      severity: 'warning'
    },
    {
      label: 'Pakket, men ikke levert',
      count: data.problems.packedNotDelivered.length,
      severity: 'info'
    },
    {
      label: 'Ikke levert',
      count: data.problems.notDelivered.length,
      severity: 'warning'
    }
  ]

  return `
    <section class="analytics-card">
      <div class="analytics-card-header">
        <h3>Kontrolliste</h3>
        <span>Ting som bør sjekkes</span>
      </div>

      <div class="analytics-problem-list">
        ${problemRows.map(problem => `
          <div class="analytics-problem-row is-${problem.severity}">
            <span>${escapeHtml(problem.label)}</span>
            <strong>${problem.count}</strong>
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderRankRow({ rank, title, meta, value }) {
  return `
    <div class="analytics-rank-row">
      <div class="analytics-rank-number">${rank}</div>

      <div class="analytics-rank-main">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(meta)}</span>
      </div>

      <div class="analytics-rank-value">
        ${escapeHtml(value)}
      </div>
    </div>
  `
}

function renderEmpty(text) {
  return `
    <div class="analytics-empty">
      ${escapeHtml(text)}
    </div>
  `
}

function addCustomerStat(map, customerName, weightKg, lineCount) {
  if (!map.has(customerName)) {
    map.set(customerName, {
      customerName,
      totalWeightKg: 0,
      orderLineCount: 0
    })
  }

  const item = map.get(customerName)

  item.totalWeightKg += weightKg
  item.orderLineCount += lineCount
}

function addDeliveryDayStat(map, deliveryDay, weightKg, lineCount) {
  if (!map.has(deliveryDay)) {
    map.set(deliveryDay, {
      deliveryDay,
      customerCount: 0,
      orderLineCount: 0,
      totalWeightKg: 0
    })
  }

  const item = map.get(deliveryDay)

  item.customerCount += 1
  item.orderLineCount += lineCount
  item.totalWeightKg += weightKg
}

function addProductStats(map, row) {
  state.products.forEach(productName => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    items.forEach(item => {
      const qty = Number(item.qty) || 0
      const weightKg = Number(item.weightKg) || getFallbackWeight(item)

      if (qty <= 0) return

      if (!map.has(productName)) {
        map.set(productName, {
          productName,
          totalWeightKg: 0,
          orderLineCount: 0
        })
      }

      const product = map.get(productName)

      product.totalWeightKg += qty * weightKg
      product.orderLineCount += 1
    })
  })
}

function getRowWeight(row) {
  let total = 0

  state.products.forEach(productName => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    items.forEach(item => {
      const qty = Number(item.qty) || 0
      const weightKg = Number(item.weightKg) || getFallbackWeight(item)

      total += qty * weightKg
    })
  })

  return total
}

function getRowLineCount(row) {
  let count = 0

  state.products.forEach(productName => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    count += items.filter(item => Number(item.qty) > 0).length
  })

  return count
}

function hasOrderContent(row) {
  return state.products.some(productName => {
    const cell = row.cells?.[productName]
    return Array.isArray(cell?.items) && cell.items.length > 0
  })
}

function sortDeliveryDays(days) {
  const order = [
    ...state.deliveryDays,
    'Uten leveringsdag'
  ]

  return days.sort((a, b) => {
    const indexA = order.indexOf(a.deliveryDay)
    const indexB = order.indexOf(b.deliveryDay)

    const safeA = indexA === -1 ? 999 : indexA
    const safeB = indexB === -1 ? 999 : indexB

    return safeA - safeB
  })
}

function getFallbackWeight(item) {
  const label = String(item.label || item.packageName || '').toLowerCase()

  if (label.includes('10g')) return 0.01
  if (label.includes('125g')) return 0.125
  if (label.includes('250g')) return 0.25
  if (label.includes('500g')) return 0.5
  if (label.includes('3kg')) return 3
  if (label.includes('5kg')) return 5
  if (label.includes('6kg')) return 6
  if (label.includes('8kg')) return 8
  if (label === 'l') return 1
  if (label === 'kg') return 1

  return 1
}

function getPercent(current, total) {
  if (!total) return 0

  return Math.round((current / total) * 100)
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