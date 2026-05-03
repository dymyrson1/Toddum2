import { escapeHtml } from './modal-utils.js'

export function renderProductModalHtml(productName, items, options) {
  return `
    <div class="modal-content product-modal-content">
      <div class="product-modal-header">
        <div>
          <h2>${escapeHtml(productName)}</h2>
          <p>Rediger antall per emballasje</p>
        </div>

        <button id="closeProductModal" class="modal-close product-modal-close" type="button">
          ×
        </button>
      </div>

      <div class="product-modal-body">
        <table class="product-modal-table">
          <thead>
            <tr>
              <th>Emballasje</th>
              <th>Vekt</th>
              <th>Antall</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${items.map((item, index) => renderMiniRow(item, index, options)).join('')}
          </tbody>
        </table>

        <button id="addProductMiniRow" class="secondary-btn product-modal-add-btn" type="button">
          + Legg til
        </button>
      </div>

      <div class="product-modal-actions">
        <button id="cancelProductModal" class="secondary-btn" type="button">
          Avbryt
        </button>

        <button id="saveProductModal" class="primary-btn" type="button">
          Lagre
        </button>
      </div>
    </div>
  `
}

function renderMiniRow(item, index, options) {
  return `
    <tr>
      <td>
        <select data-mini-package-index="${index}">
          ${options.map((option) => renderPackageOption(option, item.packageId)).join('')}
        </select>
      </td>

      <td class="product-modal-weight-cell">
        ${escapeHtml(formatWeight(item))}
      </td>

      <td>
        <input
          type="number"
          min="0"
          step="1"
          value="${escapeHtml(item.qty || '')}"
          data-mini-qty-index="${index}"
        />
      </td>

      <td class="product-modal-remove-cell">
        <button
          class="icon-btn product-modal-remove-btn"
          type="button"
          data-remove-mini-row="${index}"
        >
          ×
        </button>
      </td>
    </tr>
  `
}

function renderPackageOption(option, selectedPackageId) {
  const selected = option.id === selectedPackageId ? 'selected' : ''

  return `
    <option value="${escapeHtml(option.id)}" ${selected}>
      ${escapeHtml(option.packageName || option.label || '')}
    </option>
  `
}

function formatWeight(item) {
  const weight = Number(item.weightKg)

  if (!Number.isFinite(weight) || weight <= 0) {
    return item.label || ''
  }

  if (weight >= 1) {
    return `${weight * 1000} g`
  }

  return `${Math.round(weight * 1000)} g`
}
