import { state } from '../state.js'
import { getRowStatusClass } from './table-formatters.js'
import {
  renderCheckCell,
  renderCustomerCell,
  renderStatusCell,
  renderDeleteRowCell,
  renderDeliveryDayCell,
  renderMerknadCell,
  renderProductCell
} from './table-cell-render.js'

export function renderTableRow(row) {
  const rowClass = getRowStatusClass(row)

  return `
    <tr class="${rowClass}">
      ${renderCustomerCell(row)}
      ${renderStatusCell(row)}
      ${renderTimeCell(row)}
      ${state.products.map((product) => renderProductCell(row, product)).join('')}
      ${renderCheckCell(row, 'A')}
      ${renderCheckCell(row, 'B')}
      ${renderDeliveryDayCell(row)}
      ${renderMerknadCell(row)}
      ${renderDeleteRowCell(row)}
    </tr>
  `
}


function renderTimeCell(row) {
  return `
    <td class="time-cell">
      ${formatRowTimeMeta(row)}
    </td>
  `
}

function formatRowTimeMeta(row) {
  const updated = formatShort(row.updatedAt)
  const created = formatShort(row.createdAt)

  if (updated) return `Endret ${updated}`
  if (created) return `Lagt til ${created}`
  return '—'
}

function formatShort(value) {
  if (!value) return ''

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  return new Intl.DateTimeFormat('no-NO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}
