import { getCustomerName, state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { renderTableHead } from './table-head-render.js'
import { renderTableRow } from './table-body-render.js'
import { getSortLabel, isDeliveryFlowSortEnabled, sortRowsForDisplay } from './table-sort.js'
import {
  getCustomerSearch,
  normalizeSearchValue
} from '../shared/customer-search.js'

let rowTimeFilter = 'all'

export function setRowTimeFilter(value) {
  rowTimeFilter = value || 'all'
}

export function getRowTimeFilter() {
  return rowTimeFilter
}

function filterRowsByTime(rows) {
  if (rowTimeFilter === 'all') return rows

  return rows.filter((row) => {
    const created = Date.parse(row.createdAt || '')
    const updated = Date.parse(row.updatedAt || '')

    if (!Number.isFinite(created) || !Number.isFinite(updated)) return false

    if (rowTimeFilter === 'new') {
      return Math.abs(updated - created) < 1000
    }

    if (rowTimeFilter === 'updated') {
      return updated > created
    }

    return true
  })
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

  const searchValue = getCustomerSearch('orders')
  const filteredRows = filterRowsByCustomerSearch(rows, searchValue)
  const timeFiltered = filterRowsByTime(filteredRows)
  const visibleRows = sortRowsForDisplay(timeFiltered)

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

      <div class="table-time-filter">
        ${renderTimeFilterButton('all', 'Alle')}
        ${renderTimeFilterButton('new', 'Ny')}
        ${renderTimeFilterButton('updated', 'Endret')}
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

function renderTimeFilterButton(value, label) {
  return `
    <button
      class="time-filter-btn ${rowTimeFilter === value ? 'active' : ''}"
      type="button"
      data-time-filter="${escapeHtml(value)}"
    >
      ${escapeHtml(label)}
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
