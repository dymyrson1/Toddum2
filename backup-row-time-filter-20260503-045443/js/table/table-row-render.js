import { getCustomerName, state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { renderTableHead } from './table-head-render.js'
import { renderTableRow } from './table-body-render.js'
import { getSortLabel, isDeliveryFlowSortEnabled, sortRowsForDisplay } from './table-sort.js'
import {
  getCustomerSearch,
  normalizeSearchValue
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

  const searchValue = getCustomerSearch('orders')
  const filteredRows = filterRowsByCustomerSearch(rows, searchValue)
  const visibleRows = sortRowsForDisplay(filteredRows)

  return `
    <div class="table-control-panel">
      <div class="customer-search-box">
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

      <div class="table-search-count">
        Viser ${visibleRows.length} av ${rows.length} rader
      </div>

      <button class="date-sort-btn" type="button" data-sort-key="createdAt">
        ${getSortLabel('createdAt', 'Lagt til')}
      </button>

      <button class="date-sort-btn" type="button" data-sort-key="updatedAt">
        ${getSortLabel('updatedAt', 'Endret')}
      </button>

      <button
        class="delivery-flow-switch ${isDeliveryFlowSortEnabled() ? 'active' : ''}"
        type="button"
        data-delivery-flow-sort
        aria-pressed="${isDeliveryFlowSortEnabled() ? 'true' : 'false'}"
      >
        <span class="delivery-flow-switch-track">
          <span class="delivery-flow-switch-thumb"></span>
        </span>
        <span class="delivery-flow-switch-label">Aktive først</span>
      </button>
    </div>

    <div class="table-scroll">
      <table class="main-table">
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

function filterRowsByCustomerSearch(rows, searchValue) {
  const query = normalizeSearchValue(searchValue)

  if (!query) return rows

  return rows.filter((row) => {
    return normalizeSearchValue(row.customerName).includes(query)
  })
}
