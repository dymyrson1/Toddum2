import { getCustomerName, state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { renderTableHead } from './table-head-render.js'
import { renderTableRow } from './table-body-render.js'
import { getSortLabel, sortRowsForDisplay } from './table-sort.js'

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

    <div class="table-sort-toolbar">
      <button class="table-sort-btn" type="button" data-sort-key="customer">
        ${getSortLabel('customer', 'Kunde')}
      </button>

      <button class="table-sort-btn" type="button" data-sort-key="packed">
        ${getSortLabel('packed', 'Pakket')}
      </button>

      <button class="table-sort-btn" type="button" data-sort-key="delivered">
        ${getSortLabel('delivered', 'Levert')}
      </button>

      <button class="table-sort-btn" type="button" data-sort-key="deliveryDay">
        ${getSortLabel('deliveryDay', 'Delivery day')}
      </button>
    </div>

    <div class="table-scroll">
      <table>
        ${renderTableHead()}
        <tbody>
          ${visibleRows.map((row) => renderTableRow(row)).join('')}
        </tbody>
      </table>
    </div>

    <button id="addOrderRowBtn" class="add-row-main-btn" type="button">
      + Legg til rad
    </button>
  `
}
