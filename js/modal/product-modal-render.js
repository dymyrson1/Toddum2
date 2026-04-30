import { escapeHtml } from './modal-utils.js'

export function renderProductModalHtml(productName, items, options) {
  return `
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h3>${escapeHtml(productName)}</h3>
          <div class="modal-cell-key">
            Rediger bestilling
          </div>
        </div>

        <button id="closeProductModal" class="modal-close" type="button">
          ×
        </button>
      </div>

      <table id="miniTable">
        <thead>
          <tr>
            <th>Emballasje</th>
            <th>Antall</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          ${items.map((item, index) => renderMiniRow(item, index, items, options)).join('')}
        </tbody>
      </table>

      <button id="addMiniRowBtn" class="secondary-btn" type="button">
        + Legg til
      </button>

      <div class="modal-actions">
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

function renderMiniRow(item, index, items, options) {
  const usedPackageIds = new Set(
    items.filter((_, itemIndex) => itemIndex !== index).map((entry) => entry.packageId)
  )

  const availableOptions = options.filter((option) => {
    return !usedPackageIds.has(option.id) || option.id === item.packageId
  })

  return `
    <tr>
      <td>
        <select data-mini-package-index="${index}">
          ${availableOptions.map((option) => renderPackageOption(option, item)).join('')}
        </select>
      </td>

      <td>
        <input
          type="number"
          min="0"
          step="any"
          value="${escapeHtml(item.qty || '')}"
          data-mini-qty-index="${index}"
        >
      </td>

      <td>
        <button
          class="remove-row-btn"
          data-remove-mini-row="${index}"
          type="button"
        >
          ×
        </button>
      </td>
    </tr>
  `
}

function renderPackageOption(option, item) {
  return `
    <option
      value="${escapeHtml(option.id)}"
      ${option.id === item.packageId ? 'selected' : ''}
    >
      ${escapeHtml(option.label)}
    </option>
  `
}
