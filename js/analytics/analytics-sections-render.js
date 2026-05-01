import { escapeHtml } from '../utils/html.js'
import { formatKg } from './analytics-formatters.js'

export function renderDeliveryDaySection(data) {
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
                  ${data.deliveryDayList.map(renderDeliveryDayRow).join('')}
                </tbody>
              </table>
            </div>
          `
      }
    </section>
  `
}

export function renderTopCustomersSection(data) {
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
              ${topCustomers
                .map((customer, index) =>
                  renderRankRow({
                    rank: index + 1,
                    title: customer.customerName,
                    meta: `${customer.orderLineCount} ordrelinjer`,
                    value: formatKg(customer.totalWeightKg)
                  })
                )
                .join('')}
            </div>
          `
      }
    </section>
  `
}

export function renderTopProductsSection(data) {
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
              ${topProducts
                .map((product, index) =>
                  renderRankRow({
                    rank: index + 1,
                    title: product.productName,
                    meta: `${product.orderLineCount} ordrelinjer`,
                    value: formatKg(product.totalWeightKg)
                  })
                )
                .join('')}
            </div>
          `
      }
    </section>
  `
}

export function renderProblemsSection(data) {
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
        ${problemRows.map(renderProblemRow).join('')}
      </div>
    </section>
  `
}

function renderDeliveryDayRow(day) {
  return `
    <tr>
      <td><strong>${escapeHtml(day.deliveryDay)}</strong></td>
      <td>${day.customerCount}</td>
      <td>${day.orderLineCount}</td>
      <td>${formatKg(day.totalWeightKg)}</td>
    </tr>
  `
}

function renderProblemRow(problem) {
  return `
    <div class="analytics-problem-row is-${escapeHtml(problem.severity)}">
      <span>${escapeHtml(problem.label)}</span>
      <strong>${problem.count}</strong>
    </div>
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
