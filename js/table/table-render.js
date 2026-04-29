import { state, getCurrentCells } from '../state.js'
import { attachTableEvents } from './table-events.js'

export function renderOrdersTab() {
  renderTable()
}

export function renderTable() {
  const container = document.getElementById('tableContainer')

  if (!container) return

  const cells = getCurrentCells()

  if (state.customers.length === 0 || state.products.length === 0) {
    container.innerHTML = `
      <div class="empty-table-message">
        Додай хоча б одного замовника і один продукт у вкладці Settings.
      </div>
    `
    return
  }

  let html = `
    <div class="table-scroll">
      <table class="main-table">
        <thead>
          <tr>
            <th class="corner-cell">Customer</th>
  `

  state.products.forEach(product => {
    html += `<th>${escapeHtml(product)}</th>`
  })

  html += `
            <th class="check-column">A</th>
            <th class="check-column">B</th>
          </tr>
        </thead>
        <tbody>
  `

  state.customers.forEach(customer => {
    html += `
          <tr>
            <th class="customer-cell">${escapeHtml(customer)}</th>
    `

    state.products.forEach(product => {
      const key = makeCellKey(customer, product)
      const cellData = cells[key]

      let cellText = '<span class="cell-empty">—</span>'

      if (cellData && cellData.items && cellData.items.length > 0) {
        cellText = cellData.items
          .map(item => `${escapeHtml(item.type)}: ${escapeHtml(item.qty)}`)
          .join('<br>')
      }

      html += `
            <td class="editable-cell" data-key="${escapeHtml(key)}">
              ${cellText}
            </td>
      `
    })

    const checkKey = makeCheckKey(customer)
    const checks = cells[checkKey] || {
      A: false,
      B: false
    }

    html += `
            <td class="check-cell">
              <input 
                type="checkbox" 
                data-check="${escapeHtml(customer)}__A"
                ${checks.A ? 'checked' : ''}
              >
            </td>

            <td class="check-cell">
              <input 
                type="checkbox" 
                data-check="${escapeHtml(customer)}__B"
                ${checks.B ? 'checked' : ''}
              >
            </td>
          </tr>
    `
  })

  html += `
        </tbody>
      </table>
    </div>
  `

  container.innerHTML = html

  attachTableEvents()
}

function makeCellKey(customer, product) {
  return `${customer}__${product}`
}

function makeCheckKey(customer) {
  return `${customer}__checks`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}