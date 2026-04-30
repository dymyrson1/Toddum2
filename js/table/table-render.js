import { state, getCurrentRows } from '../state.js'
import { attachTableEvents } from './table-events.js'

export function renderOrdersTab() {
  renderTable()
}

export function renderTable() {
  const container = document.getElementById('tableContainer')
  if (!container) return

  const rows = getCurrentRows()

  let html = `
    <datalist id="customersDatalist">
      ${state.customers.map(customer => `
        <option value="${escapeHtml(customer)}"></option>
      `).join('')}
    </datalist>

    <div class="table-scroll">
      <table class="main-table">
        <thead>
          <tr>
            <th class="corner-cell">Customer</th>
            <th class="delivery-day-column">Delivery day</th>
  `

  state.products.forEach(product => {
    html += `<th>${escapeHtml(product)}</th>`
  })

  html += `
            <th class="check-column">A</th>
            <th class="check-column">B</th>
            <th class="row-action-column"></th>
          </tr>
        </thead>
        <tbody>
  `

  rows.forEach(row => {
    html += `
      <tr data-row-id="${escapeHtml(row.id)}">
        <th class="customer-cell">
          <input
            class="customer-input"
            type="text"
            value="${escapeHtml(row.customerName || '')}"
            list="customersDatalist"
            placeholder="Customer"
            data-row-field="customerName"
            data-row-id="${escapeHtml(row.id)}"
          >
        </th>

        <td class="delivery-day-cell">
          <select 
            data-row-field="deliveryDay"
            data-row-id="${escapeHtml(row.id)}"
          >
            <option value="">—</option>
            ${renderDeliveryDayOptions(row.deliveryDay)}
          </select>
        </td>
    `

    state.products.forEach(product => {
      const cellData = row.cells?.[product]
      let cellText = '<span class="cell-empty">—</span>'

      if (cellData && Array.isArray(cellData.items) && cellData.items.length > 0) {
        cellText = cellData.items
          .map(item => renderCellItem(item))
          .join('<br>')
      }

      html += `
        <td 
          class="editable-cell" 
          data-row-id="${escapeHtml(row.id)}"
          data-product="${escapeHtml(product)}"
        >
          ${cellText}
        </td>
      `
    })

    html += `
        <td class="check-cell">
          <input 
            type="checkbox" 
            data-row-check="A"
            data-row-id="${escapeHtml(row.id)}"
            ${row.checks?.A ? 'checked' : ''}
          >
        </td>

        <td class="check-cell">
          <input 
            type="checkbox" 
            data-row-check="B"
            data-row-id="${escapeHtml(row.id)}"
            ${row.checks?.B ? 'checked' : ''}
          >
        </td>

        <td class="row-action-cell">
          <button 
            class="delete-row-btn" 
            data-delete-row="${escapeHtml(row.id)}"
            title="Видалити рядок"
          >
            ×
          </button>
        </td>
      </tr>
    `
  })

  html += `
        </tbody>
      </table>
    </div>

    <button id="addOrderRowBtn" class="add-row-main-btn">
      + Додати рядок
    </button>
  `

  container.innerHTML = html
  attachTableEvents()
}

function renderCellItem(item) {
  const qty = Number(item.qty) || 0
  const label = item.label || item.packageName || item.type || '—'
  const packageName = String(item.packageName || '').toLowerCase()
  const labelLower = String(label).toLowerCase()

  if (packageName === 'kg' || labelLower === 'kg') {
    return `${escapeHtml(formatNumber(qty))}kg`
  }

  if (packageName.includes('spann') || labelLower.includes('spann')) {
    return `${escapeHtml(formatNumber(qty))} spann`
  }

  return `${escapeHtml(formatNumber(qty))}-${escapeHtml(label)}`
}

function renderDeliveryDayOptions(selectedDay) {
  return state.deliveryDays.map(day => `
    <option 
      value="${escapeHtml(day)}"
      ${day === selectedDay ? 'selected' : ''}
    >
      ${escapeHtml(day)}
    </option>
  `).join('')
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