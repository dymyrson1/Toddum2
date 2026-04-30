import {
  state,
  getCurrentRows,
  getCurrentWeekLabel,
  getCustomerName,
  updateRowCheck
} from '../state.js'

let selectedDeliveryDay = 'Alle'

export function renderLeveringView(container) {
  const data = getLeveringData()
  const visibleGroups = getVisibleGroups(data.groups)

  container.innerHTML = `
    <section id="leveringTab" class="tab-panel levering-panel">
      <div class="levering-hero">
        <div>
          <h2>Levering</h2>
          <p>${escapeHtml(getCurrentWeekLabel())}</p>
        </div>

        <div class="levering-summary">
          <span>Leveranser</span>
          <strong>${data.deliveries.length}</strong>
        </div>
      </div>

      ${renderDayFilter(data)}
      ${renderDeliveryGroups(visibleGroups)}
    </section>
  `

  attachLeveringEvents()
}

function getLeveringData() {
  const rows = getCurrentRows()

  const deliveries = rows
    .filter(row => hasOrderContent(row))
    .map(row => {
      const customer = findCustomerForRow(row.customerName)
      const deliveryDay = row.deliveryDay || 'Uten leveringsdag'

      return {
        rowId: row.id,
        deliveryOrder: getDeliveryOrder(customer),
        customerName: row.customerName || 'Uten kunde',
        address: customer?.address || '',
        phone: customer?.phone || '',
        contactPerson: customer?.contactPerson || '',
        deliveryDay,
        items: getDeliveryItems(row),
        packed: Boolean(row.checks?.A),
        delivered: Boolean(row.checks?.B)
      }
    })
    .sort(sortDeliveriesByCustomerNumber)

  return {
    deliveries,
    groups: groupDeliveriesByDay(deliveries)
  }
}

function groupDeliveriesByDay(deliveries) {
  const groups = new Map()

  deliveries.forEach(delivery => {
    if (!groups.has(delivery.deliveryDay)) {
      groups.set(delivery.deliveryDay, [])
    }

    groups.get(delivery.deliveryDay).push(delivery)
  })

  return getDeliveryDayOrder()
    .filter(day => groups.has(day))
    .map(day => ({
      day,
      deliveries: groups.get(day).sort(sortDeliveriesByCustomerNumber)
    }))
}

function getDeliveryDayOrder() {
  return [
    ...state.deliveryDays,
    'Uten leveringsdag'
  ]
}

function getVisibleGroups(groups) {
  if (selectedDeliveryDay === 'Alle') {
    return groups
  }

  return groups.filter(group => group.day === selectedDeliveryDay)
}

function renderDayFilter(data) {
  const availableDays = new Set(data.groups.map(group => group.day))

  const filterItems = [
    {
      label: 'Alle',
      value: 'Alle',
      count: data.deliveries.length
    },
    ...getDeliveryDayOrder()
      .filter(day => availableDays.has(day))
      .map(day => ({
        label: day,
        value: day,
        count: data.groups.find(group => group.day === day)?.deliveries.length || 0
      }))
  ]

  if (!filterItems.some(item => item.value === selectedDeliveryDay)) {
    selectedDeliveryDay = 'Alle'
  }

  return `
    <div class="delivery-day-filter">
      ${filterItems.map(item => `
        <button
          class="${item.value === selectedDeliveryDay ? 'active' : ''}"
          data-delivery-day-filter="${escapeHtml(item.value)}"
        >
          <span>${escapeHtml(item.label)}</span>
          <strong>${item.count}</strong>
        </button>
      `).join('')}
    </div>
  `
}

function renderDeliveryGroups(groups) {
  if (groups.length === 0) {
    return `
      <div class="empty-table-message">
        Ingen leveranser for valgt dag.
      </div>
    `
  }

  if (selectedDeliveryDay === 'Alle') {
    return `
      <div class="delivery-groups">
        ${groups.map(group => `
          <section class="delivery-group">
            <div class="delivery-group-header">
              <h3>${escapeHtml(group.day)}</h3>
              <span>${group.deliveries.length} leveranser</span>
            </div>

            ${renderDeliveryTable(group.deliveries)}
          </section>
        `).join('')}
      </div>
    `
  }

  return renderDeliveryTable(groups[0].deliveries)
}

function renderDeliveryTable(deliveries) {
  return `
    <div class="delivery-table-wrap">
      <table class="delivery-table">
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Kunde</th>
            <th>Adresse</th>
            <th>Telefon</th>
            <th>Varer</th>
            <th>Pakket</th>
            <th>Levert</th>
          </tr>
        </thead>

        <tbody>
          ${deliveries.map(delivery => `
            <tr class="${getDeliveryRowClass(delivery)}">
              <td class="delivery-number">
                ${delivery.deliveryOrder === null ? '—' : escapeHtml(delivery.deliveryOrder)}
              </td>

              <td>
                <strong>${escapeHtml(delivery.customerName)}</strong>
                ${delivery.contactPerson ? `<div class="delivery-subtext">${escapeHtml(delivery.contactPerson)}</div>` : ''}
              </td>

              <td>${renderAddressLink(delivery.address)}</td>

              <td>${escapeHtml(delivery.phone || '—')}</td>

              <td class="delivery-items-cell">
                ${renderDeliveryItems(delivery.items)}
              </td>

              <td class="delivery-check-cell">
                <input
                  type="checkbox"
                  data-delivery-row-id="${escapeHtml(delivery.rowId)}"
                  data-delivery-check="A"
                  ${delivery.packed ? 'checked' : ''}
                  aria-label="Pakket"
                >
              </td>

              <td class="delivery-check-cell">
                <input
                  type="checkbox"
                  data-delivery-row-id="${escapeHtml(delivery.rowId)}"
                  data-delivery-check="B"
                  ${delivery.delivered ? 'checked' : ''}
                  aria-label="Levert"
                >
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function getDeliveryRowClass(delivery) {
  if (delivery.packed && delivery.delivered) {
    return 'delivery-row-done'
  }

  if (delivery.packed) {
    return 'delivery-row-packed'
  }

  if (delivery.delivered) {
    return 'delivery-row-done'
  }

  return ''
}

function attachLeveringEvents() {
  const container = document.getElementById('tabContent')

  document.querySelectorAll('[data-delivery-day-filter]').forEach(button => {
    button.onclick = () => {
      selectedDeliveryDay = button.dataset.deliveryDayFilter
      renderLeveringView(container)
    }
  })

  document.querySelectorAll('[data-delivery-row-id][data-delivery-check]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateRowCheck(
        checkbox.dataset.deliveryRowId,
        checkbox.dataset.deliveryCheck,
        checkbox.checked
      )

      renderLeveringView(container)
    })
  })
}

function findCustomerForRow(customerName) {
  const cleanRowName = normalizeText(customerName)

  if (!cleanRowName) return null

  return state.customers.find(customer => {
    return normalizeText(getCustomerName(customer)) === cleanRowName
  }) || null
}

function getDeliveryOrder(customer) {
  const order = Number(customer?.deliveryOrder)

  if (!Number.isFinite(order) || order <= 0) {
    return null
  }

  return order
}

function sortDeliveriesByCustomerNumber(a, b) {
  const orderA = a.deliveryOrder
  const orderB = b.deliveryOrder

  if (orderA !== null && orderB !== null && orderA !== orderB) {
    return orderA - orderB
  }

  if (orderA !== null && orderB === null) {
    return -1
  }

  if (orderA === null && orderB !== null) {
    return 1
  }

  return a.customerName.localeCompare(b.customerName)
}

function hasOrderContent(row) {
  return Object.values(row.cells || {}).some(cell => {
    return Array.isArray(cell.items) && cell.items.length > 0
  })
}

function getDeliveryItems(row) {
  return Object.entries(row.cells || {})
    .map(([productName, cell]) => {
      const items = Array.isArray(cell.items) ? cell.items : []

      const itemText = items
        .map(formatDeliveryItem)
        .filter(Boolean)
        .join(', ')

      if (!itemText) return null

      return {
        productName,
        itemText
      }
    })
    .filter(Boolean)
}

function renderDeliveryItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '—'
  }

  return `
    <div class="delivery-items-list">
      ${items.map(item => `
        <div class="delivery-item-line">
          <strong>${escapeHtml(item.productName)}:</strong>
          <span>${escapeHtml(item.itemText)}</span>
        </div>
      `).join('')}
    </div>
  `
}

function formatDeliveryItem(item) {
  const qty = Number(item.qty) || 0
  const label = item.label || item.packageName || item.type || '—'
  const packageName = String(item.packageName || '').toLowerCase()
  const labelLower = String(label).toLowerCase()

  if (!qty) return ''

  if (packageName === 'kg' || labelLower === 'kg') {
    return `${formatNumber(qty)}kg`
  }
if (
  packageName === 'l' ||
  packageName === 'liter' ||
  packageName === 'literer' ||
  labelLower === 'l' ||
  labelLower === 'liter' ||
  labelLower === 'literer'
) {
  return `${formatNumber(qty)}l`
}
  if (packageName.includes('spann') || labelLower.includes('spann')) {
    return `${formatNumber(qty)} spann`
  }

  return `${formatNumber(qty)}x${label}`
}

function renderAddressLink(address) {
  const cleanAddress = String(address || '').trim()

  if (!cleanAddress) {
    return '—'
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`

  return `
    <a
      href="${mapsUrl}"
      target="_blank"
      rel="noopener noreferrer"
      class="delivery-address-link"
    >
      ${escapeHtml(cleanAddress)}
    </a>
  `
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
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