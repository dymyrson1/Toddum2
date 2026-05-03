import { getCurrentRows } from '../state.js'
import { attachTableEvents } from './table-events.js'
import { renderCustomerDatalist, renderOrdersTable } from './table-row-render.js'

export function renderOrdersTab() {
  renderTable()
}

export function renderTable() {
  const container = document.getElementById('tableContainer')

  if (!container) return

  const rows = getCurrentRows()

  container.innerHTML = `
    ${renderCustomerDatalist()}
    ${renderOrdersTable(rows)}
  `

  attachTableEvents()
}
