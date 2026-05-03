import { getCustomerName, state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { renderTableHead } from './table-head-render.js'
import { renderTableRow } from './table-body-render.js'

let customerSortMode = 'default'
// default | asc | desc

export function toggleCustomerSortMode() {
  if (customerSortMode === 'default') {
    customerSortMode = 'asc'
    return
  }

  if (customerSortMode === 'asc') {
    customerSortMode = 'desc'
    return
  }

  customerSortMode = 'default'
}

export function getCustomerSortMode() {
  return customerSortMode
}

export function renderCustomerDatalist() {
  return `
    <datalist id="customerList">
      ${state.customers
        .map((customer) => {
          const name = getCustomerName(customer)
          if (!name) return ''
          return `<option value="${escapeHtml(name)}"></option>`
        })
        .join('')}
    </datalist>
  `
}

export function renderOrdersTable(rows) {
  if (!Array.isArray(rows)) {
    rows = []
  }

  const visibleRows = sortRowsForDisplay(rows)

  return `
    ${renderCustomerDatalist()}

    <div class="table-toolbar">
      <button id="customerSortBtn" class="secondary-btn customer-sort-btn" type="button">
        ${getSortButtonLabel()}
      </button>
    </div>

    <div class="table-scroll">
      <table class="orders-table">
        ${renderTableHead()}
        <tbody>
          ${visibleRows.map((row) => renderTableRow(row)).join('')}
        </tbody>
      </table>
    </div>

    <button id="addRowBtn" class="add-row-btn" type="button">
      + Legg til rad
    </button>
  `
}

function sortRowsForDisplay(rows) {
  if (customerSortMode === 'default') {
    return rows
  }

  return [...rows].sort((a, b) => {
    const nameA = String(a.customerName || '').trim()
    const nameB = String(b.customerName || '').trim()

    if (!nameA && !nameB) return 0
    if (!nameA) return 1
    if (!nameB) return -1

    const result = nameA.localeCompare(nameB, 'nb', {
      sensitivity: 'base',
      numeric: true
    })

    return customerSortMode === 'asc' ? result : -result
  })
}

function getSortButtonLabel() {
  if (customerSortMode === 'asc') return 'Kunde A–Å'
  if (customerSortMode === 'desc') return 'Kunde Å–A'
  return 'Kunde: vanlig'
}