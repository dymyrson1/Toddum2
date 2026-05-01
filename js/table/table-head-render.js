import { state } from '../state.js'
import { escapeHtml } from './table-formatters.js'

export function renderTableHead() {
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

export function renderProductHeader(product) {
  return `<th>${escapeHtml(product)}</th>`
}
