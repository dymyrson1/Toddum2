import { state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { getSortArrow } from './table-sort.js'

export function renderTableHead() {
  return `
    <thead>
      <tr>
        ${renderSortableHeader('customer', 'Customer')}
        <th>Status</th>
        <th>Tid</th>

        ${state.products.map((product) => renderProductHeader(product)).join('')}

        ${renderSortableHeader('packed', 'A', 'check-column')}
        ${renderSortableHeader('delivered', 'B', 'check-column')}
        ${renderSortableHeader('deliveryDay', 'Delivery day')}
        ${renderSortableHeader('merknad', 'Merknad')}
        <th class="delete-column"></th>
      </tr>
    </thead>
  `
}

export function renderProductHeader(product) {
  return renderSortableHeader(`product:${product}`, product)
}

function renderSortableHeader(sortKey, label, extraClass = '') {
  return `
    <th class="${extraClass}">
      <button class="table-head-sort-btn" type="button" data-sort-key="${escapeHtml(sortKey)}">
        <span>${escapeHtml(label)}</span>
        <span class="sort-arrow">${getSortArrow(sortKey)}</span>
      </button>
    </th>
  `
}
