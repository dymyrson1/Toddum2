import { getCustomerName, state } from '../state.js'
import { escapeHtml, getRowStatusClass, renderCellItems } from './table-formatters.js'

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

  return `
    <div class="table-scroll">
      <table class="main-table">
        ${renderTableHead()}
        <tbody>
          ${rows.map((row) => renderTableRow(row)).join('')}
        </tbody>
      </table>
    </div>

    <button id="addOrderRowBtn" class="add-row-main-btn" type="button">
      + Legg til rad
    </button>
  `
}

function renderTableHead() {
  return `
    <thead>
      <tr>
        <th class="corner-cell">Customer</th>
        ${state.products.map((product) => renderProductHeader(product)).join('')}
        <th class="check-column">A</th>
        <th class="check-column">B</th>
        <th class="delivery-day-column">Delivery day</th>
        <th class="merknad-column">Merknad</th>
        <th></th>
      </tr>
    </thead>
  `
}

function renderProductHeader(product) {
  return `<th>${escapeHtml(product)}</th>`
}

function renderTableRow(row) {
  const rowClass = getRowStatusClass(row)

  return `
    <tr class="${rowClass}">
      ${renderCustomerCell(row)}
      ${state.products.map((product) => renderProductCell(row, product)).join('')}
      ${renderCheckCell(row, 'A')}
      ${renderCheckCell(row, 'B')}
      ${renderDeliveryDayCell(row)}
      ${renderMerknadCell(row)}
      ${renderDeleteRowCell(row)}
    </tr>
  `
}

function renderCustomerCell(row) {
  return `
    <th class="customer-cell">
      <input
        class="customer-input"
        type="text"
        list="customerList"
        value="${escapeHtml(row.customerName || '')}"
        data-row-id="${escapeHtml(row.id)}"
        data-row-field="customerName"
        placeholder="Kunde"
      >
    </th>
  `
}

function renderProductCell(row, product) {
  const cellData = row.cells?.[product]

  return `
    <td
      class="editable-cell"
      data-row-id="${escapeHtml(row.id)}"
      data-product="${escapeHtml(product)}"
      title="Klikk for å redigere"
    >
      ${renderCellItems(cellData)}
    </td>
  `
}

function renderCheckCell(row, checkType) {
  return `
    <td class="check-cell">
      <input
        type="checkbox"
        data-row-id="${escapeHtml(row.id)}"
        data-row-check="${escapeHtml(checkType)}"
        ${row.checks?.[checkType] ? 'checked' : ''}
      >
    </td>
  `
}

function renderDeliveryDayCell(row) {
  return `
    <td class="delivery-day-cell">
      <select
        data-row-id="${escapeHtml(row.id)}"
        data-row-field="deliveryDay"
      >
        <option value="">—</option>
        ${renderDeliveryDayOptions(row.deliveryDay)}
      </select>
    </td>
  `
}

function renderDeliveryDayOptions(selectedDay) {
  return state.deliveryDays
    .map((day) => {
      return `
        <option value="${escapeHtml(day)}" ${day === selectedDay ? 'selected' : ''}>
          ${escapeHtml(day)}
        </option>
      `
    })
    .join('')
}

function renderMerknadCell(row) {
  return `
    <td
      class="merknad-cell"
      data-merknad-row-id="${escapeHtml(row.id)}"
      title="${escapeHtml(row.merknad || '')}"
    >
      ${row.merknad ? escapeHtml(row.merknad) : '<span class="cell-empty">—</span>'}
    </td>
  `
}

function renderDeleteRowCell(row) {
  return `
    <td>
      <button
        class="remove-row-btn"
        type="button"
        data-delete-row="${escapeHtml(row.id)}"
        title="Slett rad"
      >
        ×
      </button>
    </td>
  `
}
