import { getPackagingOptionsForProduct } from '../state.js'
import { escapeHtml } from '../utils/html.js'
import { formatWeightForUi } from './settings-formatters.js'

export function renderPackagingList(productName) {
  const list = document.getElementById('packagingList')

  if (!list || !productName) return

  const options = getPackagingOptionsForProduct(productName)

  list.innerHTML = `
    <div class="packaging-options-table">
      <div class="packaging-options-head">
        <span>Emballasje</span>
        <span>Vekt</span>
        <span></span>
      </div>

      ${options.map((option) => renderPackagingRow(option)).join('')}
    </div>
  `
}

function renderPackagingRow(option) {
  return `
    <div class="packaging-options-row">
      <span>
        <strong>${escapeHtml(option.label)}</strong>
        ${option.isDefault ? '<small>Standard</small>' : ''}
      </span>

      <span>${escapeHtml(formatWeightForUi(option.weightKg))}</span>

      <span>
        ${
          option.isDefault
            ? '<em>Fast</em>'
            : `
              <button
                data-remove-product-packaging="${escapeHtml(option.id)}"
                type="button"
              >
                Slett
              </button>
            `
        }
      </span>
    </div>
  `
}
