import { getAnalyticsData } from '../analytics/analytics.js'

export function renderAnalyticsView(container) {
  const data = getAnalyticsData()

  container.innerHTML = `
    <section id="analyticsTab" class="tab-panel">
      <h2>Analytics</h2>

      <div class="analytics-week">
        Поточний тиждень: <strong>${escapeHtml(data.weekId)}</strong>
      </div>

      <div class="analytics-grid">
        <div class="analytics-card">
          <span class="analytics-label">Заповнені клітинки</span>
          <strong>${data.filledCells}</strong>
        </div>

        <div class="analytics-card">
          <span class="analytics-label">Рядки в mini-table</span>
          <strong>${data.totalItems}</strong>
        </div>

        <div class="analytics-card">
          <span class="analytics-label">Загальна кількість</span>
          <strong>${formatNumber(data.totalQty)}</strong>
        </div>

        <div class="analytics-card">
          <span class="analytics-label">A checked</span>
          <strong>${data.checkedA}</strong>
        </div>

        <div class="analytics-card">
          <span class="analytics-label">B checked</span>
          <strong>${data.checkedB}</strong>
        </div>
      </div>

      <div class="analytics-sections">
        <div class="analytics-section">
          <h3>По продуктах</h3>
          ${renderTotalsList(data.productTotals)}
        </div>

        <div class="analytics-section">
          <h3>По замовниках</h3>
          ${renderTotalsList(data.customerTotals)}
        </div>
      </div>
    </section>
  `
}

function renderTotalsList(items) {
  const entries = Object.entries(items)

  if (entries.length === 0) {
    return `<p class="muted-text">Немає даних</p>`
  }

  return `
    <div class="analytics-list">
      ${entries.map(([name, value]) => `
        <div class="analytics-row">
          <span>${escapeHtml(name)}</span>
          <strong>${formatNumber(value)}</strong>
        </div>
      `).join('')}
    </div>
  `
}

function formatNumber(value) {
  return Number(value).toLocaleString('uk-UA', {
    maximumFractionDigits: 2
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}