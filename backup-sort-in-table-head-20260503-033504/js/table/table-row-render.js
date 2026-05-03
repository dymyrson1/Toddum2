import { getCustomerName, state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { renderTableHead } from './table-head-render.js'
import { renderTableRow } from './table-body-render.js'
import { getSortLabel, sortRowsForDisplay } from './table-sort.js'
import {
  filterRowsByCustomerSearch,
  getCustomerSearch
} from '../shared/customer-search.js'

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

  const sortedRows = sortRowsForDisplay(rows)
  const visibleRows = filterRowsByCustomerSearch(sortedRows, 'orders')
  const searchValue = getCustomerSearch('orders')

  return `
    <div class="table-control-panel">
      <div class="customer-search-box">
        <label for="ordersCustomerSearch">Søk kunde</label>

        <div class="customer-search-input-wrap">
          <input
            id="ordersCustomerSearch"
            class="customer-search-input"
            type="search"
            placeholder="Søk etter kundenavn..."
            value="${escapeHtml(searchValue)}"
            autocomplete="off"
          />

          <button
            id="clearOrdersCustomerSearch"
            class="customer-search-clear"
            type="button"
            ${searchValue ? '' : 'disabled'}
          >
            Tøm
          </button>
        </div>
      </div>

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
    </div>

    <div class="table-search-count">
      Viser ${visibleRows.length} av ${rows.length} rader
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
