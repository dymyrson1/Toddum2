import { state } from '../state.js'

import { escapeHtml, renderCellItems } from './table-formatters.js'

export function renderCustomerCell(row) {
  return `
    <td class="customer-cell">
      <input
        class="customer-input"
        value="${escapeHtml(row.customerName || '')}"
        data-row-id="${row.id}"
        data-customer-input
        list="customerList"
        placeholder="Kunde"
      />
    </td>
  `
}

export function renderStatusCell(row) {
  const packed = Boolean(row.checks?.A)
  const delivered = Boolean(row.checks?.B)

  if (packed && delivered) {
    return `<td class="status-cell"><span class="status-pill status-pill-done">Ferdig</span></td>`
  }

  if (packed) {
    return `<td class="status-cell"><span class="status-pill status-pill-packed">Pakket</span></td>`
  }

  if (delivered) {
    return `<td class="status-cell"><span class="status-pill status-pill-delivered">Levert</span></td>`
  }

  return `<td class="status-cell"><span class="status-pill status-pill-new">Ny</span></td>`
}

export function renderProductCell(row, product) {
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

export function renderCheckCell(row, checkType) {
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

export function renderDeliveryDayCell(row) {
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

export function renderDeliveryDayOptions(selectedDay) {
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

export function renderMerknadCell(row) {
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

export function renderDeleteRowCell(row) {
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
