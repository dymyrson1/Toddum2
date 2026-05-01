import { state } from '../state.js'
import { escapeHtml } from '../utils/html.js'

export function renderProductsList() {
  const list = document.getElementById('productsList')

  if (!list) return

  if (state.products.length === 0) {
    list.innerHTML = `<div class="settings-empty">Ingen produkter registrert.</div>`
    return
  }

  list.innerHTML = `
    <div class="products-admin-table">
      <div class="products-admin-head">
        <span>Nr.</span>
        <span>Produkt</span>
        <span>Rekkefølge</span>
        <span></span>
      </div>

      ${state.products.map((product, index) => renderProductRow(product, index)).join('')}
    </div>
  `
}

function renderProductRow(product, index) {
  return `
    <div class="products-admin-row">
      <span class="products-admin-number">${index + 1}</span>

      <strong>${escapeHtml(product)}</strong>

      <span class="products-admin-actions">
        <button
          class="move-product-btn"
          data-move-product="${escapeHtml(product)}"
          data-move-direction="up"
          ${index === 0 ? 'disabled' : ''}
          title="Flytt opp"
          type="button"
        >
          ↑
        </button>

        <button
          class="move-product-btn"
          data-move-product="${escapeHtml(product)}"
          data-move-direction="down"
          ${index === state.products.length - 1 ? 'disabled' : ''}
          title="Flytt ned"
          type="button"
        >
          ↓
        </button>
      </span>

      <button
        data-remove-product="${escapeHtml(product)}"
        type="button"
      >
        Slett
      </button>
    </div>
  `
}
