import { getOrderCell, getPackagingOptionsForProduct, updateOrderCell } from '../state.js'

import { renderTable } from '../table/table-render.js'
import { closeModal, escapeHtml, openModalContainer } from './modal-utils.js'

export function openProductModal(rowId, productName) {
  const modal = openModalContainer()

  if (!modal) return

  const cell = getOrderCell(rowId, productName)
  const options = getPackagingOptionsForProduct(productName)
  const items = normalizeModalItems(cell.items || [], options)

  renderProductModal(modal, rowId, productName, items, options)
}

function renderProductModal(modal, rowId, productName, items, options) {
  modal.innerHTML = `
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

  attachProductModalEvents(modal, rowId, productName, items, options)
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
          ${availableOptions
            .map(
              (option) => `
                <option
                  value="${escapeHtml(option.id)}"
                  ${option.id === item.packageId ? 'selected' : ''}
                >
                  ${escapeHtml(option.label)}
                </option>
              `
            )
            .join('')}
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

function attachProductModalEvents(modal, rowId, productName, items, options) {
  const closeButton = modal.querySelector('#closeProductModal')
  const cancelButton = modal.querySelector('#cancelProductModal')
  const saveButton = modal.querySelector('#saveProductModal')
  const addButton = modal.querySelector('#addMiniRowBtn')

  if (closeButton) closeButton.onclick = closeModal
  if (cancelButton) cancelButton.onclick = closeModal

  if (addButton) {
    addButton.onclick = () => {
      const nextOption = getFirstAvailableOption(items, options)

      if (!nextOption) {
        alert('Alle emballasjetyper er allerede lagt til')
        return
      }

      items.push({
        packageId: nextOption.id,
        packageName: nextOption.packageName,
        weightKg: nextOption.weightKg,
        label: nextOption.label,
        qty: ''
      })

      renderProductModal(modal, rowId, productName, items, options)
    }
  }

  if (saveButton) {
    saveButton.onclick = () => {
      const cleanItems = readModalItems(items, options)

      updateOrderCell(rowId, productName, {
        items: cleanItems
      })

      closeModal()
      renderTable()
    }
  }

  modal.querySelectorAll('[data-mini-package-index]').forEach((select) => {
    select.onchange = () => {
      const index = Number(select.dataset.miniPackageIndex)
      const option = options.find((item) => item.id === select.value)

      if (!option || !items[index]) return

      items[index] = {
        ...items[index],
        packageId: option.id,
        packageName: option.packageName,
        weightKg: option.weightKg,
        label: option.label
      }

      renderProductModal(modal, rowId, productName, items, options)
    }
  })

  modal.querySelectorAll('[data-mini-qty-index]').forEach((input) => {
    input.oninput = () => {
      const index = Number(input.dataset.miniQtyIndex)

      if (!items[index]) return

      items[index].qty = input.value
    }
  })

  modal.querySelectorAll('[data-remove-mini-row]').forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.removeMiniRow)

      items.splice(index, 1)

      renderProductModal(modal, rowId, productName, items, options)
    }
  })
}

function normalizeModalItems(items, options) {
  return items
    .map((item) => {
      const option = options.find((entry) => entry.id === item.packageId)

      if (!option) return null

      return {
        packageId: option.id,
        packageName: option.packageName,
        weightKg: option.weightKg,
        label: option.label,
        qty: item.qty || ''
      }
    })
    .filter(Boolean)
}

function readModalItems(items, options) {
  const used = new Set()

  return items
    .map((item) => {
      const option = options.find((entry) => entry.id === item.packageId)
      const qty = Number(item.qty)

      if (!option) return null
      if (!Number.isFinite(qty) || qty <= 0) return null
      if (used.has(option.id)) return null

      used.add(option.id)

      return {
        packageId: option.id,
        packageName: option.packageName,
        weightKg: option.weightKg,
        label: option.label,
        qty
      }
    })
    .filter(Boolean)
}

function getFirstAvailableOption(items, options) {
  const usedPackageIds = new Set(items.map((item) => item.packageId))

  return options.find((option) => !usedPackageIds.has(option.id)) || null
}
