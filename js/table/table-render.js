import { getCurrentRows } from '../state.js'
import { attachTableEvents } from './table-events.js'
import { renderCustomerDatalist, renderOrdersTable } from './table-row-render.js'
import {
  clearCustomerSearch,
  setCustomerSearch
} from '../shared/customer-search.js'

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
  attachOrdersCustomerSearch(container)
}

function attachOrdersCustomerSearch(container) {
  const input = container.querySelector('#ordersCustomerSearch')
  const clearButton = container.querySelector('#clearOrdersCustomerSearch')

  if (input) {
    input.oninput = () => {
      const cursorPosition = input.selectionStart || input.value.length

      setCustomerSearch('orders', input.value)
      renderTable()

      requestAnimationFrame(() => {
        const nextInput = document.getElementById('ordersCustomerSearch')
        if (!nextInput) return

        nextInput.focus()
        nextInput.setSelectionRange(cursorPosition, cursorPosition)
      })
    }
  }

  if (clearButton) {
    clearButton.onclick = () => {
      clearCustomerSearch('orders')
      renderTable()

      requestAnimationFrame(() => {
        const nextInput = document.getElementById('ordersCustomerSearch')
        if (nextInput) nextInput.focus()
      })
    }
  }
}
