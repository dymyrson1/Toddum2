import { state } from '../state.js'
import { escapeHtml } from './table-formatters.js'
import { getSortLabel } from './table-sort.js'

export function renderTableHead() {
  return `
    <thead>
      <tr>
        <th>
          <button class="table-head-sort-btn" type="button" data-sort-key="customer">
            ${getSortLabel('customer', 'Customer')}
          </button>
        </th>

        ${state.products.map((product) => renderProductHeader(product)).join('')}

        <th>
          <button class="table-head-sort-btn table-head-sort-btn-small" type="button" data-sort-key="packed">
            ${getSortLabel('packed', 'A')}
          </button>
        </th>

        <th>
          <button class="table-head-sort-btn table-head-sort-btn-small" type="button" data-sort-key="delivered">
            ${getSortLabel('delivered', 'B')}
          </button>
        </th>

        <th>
          <button class="table-head-sort-btn" type="button" data-sort-key="deliveryDay">
            ${getSortLabel('deliveryDay', 'Delivery day')}
          </button>
        </th>

        <th>Merknad</th>
        <th></th>
      </tr>
    </thead>
  `
}

export function renderProductHeader(product) {
  return `<th>${escapeHtml(product)}</th>`
}
