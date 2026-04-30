import {
  state,
  getCurrentRows,
  getCurrentWeekLabel,
  getCustomerByName
} from '../state.js'

export function renderLeveringView(container) {
  const data = getLeveringData()

  container.innerHTML = `
    <section id="leveringTab" class="tab-panel levering-panel">
      <div class="levering-hero">
        <div>
          <h2>Levering</h2>
          <p>${escapeHtml(getCurrentWeekLabel())}</p>
        </div>

        <div class="levering-summary">
          <span>Leveranser</span>
          <strong>${data.totalDeliveries}</strong>
        </div>
      </div>

      ${renderDeliveryDays(data)}
    </section>
  `
}

function getLeveringData() {
  const rows = getCurrentRows()

  const deliveryGroups = new Map()
  let totalDeliveries = 0

  rows.forEach(row => {
    if (!hasOrderContent(row)) return

    const day = row.deliveryDay || 'Uten leveringsdag'
    const customer = getCustomerByName(row.customerName)

    const delivery = {
      rowId: row.id,
      customerName: row.customerName || 'Uten kunde',
      deliveryOrder: customer?.deliveryOrder || 0,
      contactPerson: customer?.contactPerson || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      products: getProductsForDelivery(row)
    }

    if (!deliveryGroups.has(day)) {
      deliveryGroups.set(day, [])
    }

    deliveryGroups.get(day).push(delivery)
    totalDeliveries++
  })

  const days = Array.from(deliveryGroups.entries())
    .map(([day, deliveries]) => ({
      day,
      deliveries: deliveries.sort(sortDeliveries)
    }))
    .sort(sortDeliveryDays)

  return {
    totalDeliveries,
    days
  }
}

function renderDeliveryDays(data) {
  if (data.days.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen leveranser for denne uken.
      </div>
    `
  }

  return `
    <div class="levering-days">
      ${data.days.map(group => `
        <section class="levering-day-card">
          <div class="levering-day-header">
            <h3>${escapeHtml(group.day)}</h3>
            <span>${group.deliveries.length} leveranser</span>
          </div>

          <div class="levering-list">
            ${group.deliveries.map(delivery => renderDeliveryCard(delivery)).join('')}
          </div>
        </section>
      `).join('')}
    </div>
  `
}

function renderDeliveryCard(delivery) {
  return `
    <article class="levering-card">
      <div class="levering-card-main">
        <div class="levering-order-number">
          ${delivery.deliveryOrder || '—'}
        </div>

        <div class="levering-customer">
          <h4>${escapeHtml(delivery.customerName)}</h4>

          <div class="levering-meta">
            ${delivery.address ? `<span>${escapeHtml(delivery.address)}</span>` : ''}
            ${delivery.contactPerson ? `<span>${escapeHtml(delivery.contactPerson)}</span>` : ''}
            ${delivery.phone ? `<span>${escapeHtml(delivery.phone)}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="levering-products">
        ${delivery.products.map(product => `
          <div class="levering-product-row">
            <strong>${escapeHtml(product.productName)}</strong>
            <span>${escapeHtml(product.itemsText)}</span>
          </div>
        `).join('')}
      </div>
    </article>
  `
}

function getProductsForDelivery(row) {
  return Object.entries(row.cells || {})
    .map(([productName, cell]) => {
      const items = Array.isArray(cell.items) ? cell.items : []

      return {
        productName,
        itemsText: items.map(formatDeliveryItem).join(', ')
      }
    })
    .filter(product => product.itemsText)
    .sort((a, b) => a.productName.localeCompare(b.productName))
}

function formatDeliveryItem(item) {
  const qty = Number(item.qty) || 0
  const label = item.label || item.packageName || item.type || '—'
  const packageName = String(item.packageName || '').toLowerCase()
  const labelLower = String(label).toLowerCase()

  if (packageName === 'kg' || labelLower === 'kg') {
    return `${formatNumber(qty)}kg`
  }

  if (packageName.includes('spann') || labelLower.includes('spann')) {
    return `${formatNumber(qty)} spann`
  }

  return `${formatNumber(qty)}x${label}`
}

function hasOrderContent(row) {
  return Object.values(row.cells || {}).some(cell => {
    return Array.isArray(cell.items) && cell.items.length > 0
  })
}

function sortDeliveries(a, b) {
  const orderA = Number(a.deliveryOrder) || 0
  const orderB = Number(b.deliveryOrder) || 0

  if (orderA !== orderB) {
    if (orderA === 0) return 1
    if (orderB === 0) return -1
    return orderA - orderB
  }

  return a.customerName.localeCompare(b.customerName)
}

function sortDeliveryDays(a, b) {
  const indexA = state.deliveryDays.indexOf(a.day)
  const indexB = state.deliveryDays.indexOf(b.day)

  if (indexA === -1 && indexB === -1) return a.day.localeCompare(b.day)
  if (indexA === -1) return 1
  if (indexB === -1) return -1

  return indexA - indexB
}

function formatNumber(value) {
  return Number(value).toLocaleString('nb-NO', {
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