import { state } from '../state.js'
import { getRowStatusClass } from './table-formatters.js'
import {
  renderCheckCell,
  renderCustomerCell,
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
      ${state.products.map((product) => renderProductCell(row, product)).join('')}
      ${renderCheckCell(row, 'A')}
      ${renderCheckCell(row, 'B')}
      ${renderDeliveryDayCell(row)}
      ${renderMerknadCell(row)}
      ${renderDeleteRowCell(row)}
    </tr>
  `
}
