import {
  state,
  findOrderRow,
  updateOrderRowField,
  updateRowCheck,
  deleteOrderRow,
  deleteOrderCell,
  getOrderCell,
  updateOrderCell,
  getPackagingOptionsForProduct
} from '../state.js'

import { renderTable } from './table-render.js'
import { closeContextMenu } from './context-menu.js'

export function attachTableEvents() {
  attachCellEvents()
  attachRowFieldEvents()
  attachCheckboxEvents()
  attachDeleteRowEvents()
  attachAddRowEvent()
  attachMerknadEvents()
}

export function initTableKeyboardEvents() {
  document.addEventListener('keydown', event => {
    const target = event.target

    if (
      target &&
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
    ) {
      return
    }

    if (!state.selectedCell) return

    if (event.key !== 'Delete' && event.key !== 'Backspace') return

    event.preventDefault()

    const confirmed = confirm('Vil du tømme denne cellen?')
    if (!confirmed) return

    deleteOrderCell(
      state.selectedCell.rowId,
      state.selectedCell.productName
    )

    renderTable()
  })
}

function attachCellEvents() {
  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      closeContextMenu()

      const rowId = cell.dataset.rowId
      const productName = cell.dataset.product

      state.selectedCell = {
        rowId,
        productName
      }

      openProductModal(rowId, productName)
    })
  })
}

function attachRowFieldEvents() {
  document.querySelectorAll('[data-row-field]').forEach(field => {
    field.addEventListener('change', () => {
      closeContextMenu()

      updateOrderRowField(
        field.dataset.rowId,
        field.dataset.rowField,
        field.value
      )

      renderTable()
    })
  })
}

function attachCheckboxEvents() {
  document.querySelectorAll('input[data-row-check]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      closeContextMenu()

      updateRowCheck(
        checkbox.dataset.rowId,
        checkbox.dataset.rowCheck,
        checkbox.checked
      )

      renderTable()
    })
  })
}

function attachDeleteRowEvents() {
  document.querySelectorAll('[data-delete-row]').forEach(button => {
    button.addEventListener('click', () => {
      closeContextMenu()

      const confirmed = confirm('Vil du slette hele raden?')
      if (!confirmed) return

      deleteOrderRow(button.dataset.deleteRow)
      renderTable()
    })
  })
}

function attachAddRowEvent() {
  const button = document.getElementById('addOrderRowBtn')
  if (!button) return

  button.addEventListener('click', () => {
    closeContextMenu()

    const row = addRowSafely()

    if (row) {
      renderTable()
    }
  })
}

function addRowSafely() {
  if (typeof state === 'undefined') return null

  const event = new CustomEvent('add-order-row-request')
  document.dispatchEvent(event)

  if (typeof window.addOrderRow === 'function') {
    return window.addOrderRow()
  }

  return addOrderRowFallback()
}

function addOrderRowFallback() {
  const weekId = `${state.currentYear}-W${String(state.currentWeek).padStart(2, '0')}`

  if (!state.weeks[weekId]) {
    state.weeks[weekId] = {
      rows: []
    }
  }

  const row = {
    id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    customerName: '',
    deliveryDay: '',
    merknad: '',
    cells: {},
    checks: {
      A: false,
      B: false
    }
  }

  state.weeks[weekId].rows.push(row)

  return row
}

/* ===== PRODUCT MODAL ===== */

function openProductModal(rowId, productName) {
  const modal = document.getElementById('modal')
  if (!modal) return

  const cell = getOrderCell(rowId, productName)
  const options = getPackagingOptionsForProduct(productName)
  const items = normalizeModalItems(cell.items || [], options)

  modal.classList.remove('hidden')
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
    items
      .filter((_, itemIndex) => itemIndex !== index)
      .map(entry => entry.packageId)
  )

  const availableOptions = options.filter(option => {
    return !usedPackageIds.has(option.id) || option.id === item.packageId
  })

  return `
    <tr>
      <td>
        <select data-mini-package-index="${index}">
          ${availableOptions.map(option => `
            <option 
              value="${escapeHtml(option.id)}"
              ${option.id === item.packageId ? 'selected' : ''}
            >
              ${escapeHtml(option.label)}
            </option>
          `).join('')}
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
  const closeButton = document.getElementById('closeProductModal')
  const cancelButton = document.getElementById('cancelProductModal')
  const saveButton = document.getElementById('saveProductModal')
  const addButton = document.getElementById('addMiniRowBtn')

  closeButton.onclick = closeModal
  cancelButton.onclick = closeModal

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

  saveButton.onclick = () => {
    const cleanItems = readModalItems(items, options)

    updateOrderCell(rowId, productName, {
      items: cleanItems
    })

    closeModal()
    renderTable()
  }

  document.querySelectorAll('[data-mini-package-index]').forEach(select => {
    select.onchange = () => {
      const index = Number(select.dataset.miniPackageIndex)
      const option = options.find(item => item.id === select.value)

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

  document.querySelectorAll('[data-mini-qty-index]').forEach(input => {
    input.oninput = () => {
      const index = Number(input.dataset.miniQtyIndex)

      if (!items[index]) return

      items[index].qty = input.value
    }
  })

  document.querySelectorAll('[data-remove-mini-row]').forEach(button => {
    button.onclick = () => {
      const index = Number(button.dataset.removeMiniRow)

      items.splice(index, 1)

      renderProductModal(modal, rowId, productName, items, options)
    }
  })
}

function normalizeModalItems(items, options) {
  return items
    .map(item => {
      const option = options.find(entry => entry.id === item.packageId)

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
    .map(item => {
      const option = options.find(entry => entry.id === item.packageId)
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
  const usedPackageIds = new Set(items.map(item => item.packageId))

  return options.find(option => !usedPackageIds.has(option.id)) || null
}

/* ===== MERKNAD MODAL ===== */

function attachMerknadEvents() {
  document.querySelectorAll('[data-merknad-row-id]').forEach(cell => {
    cell.addEventListener('click', () => {
      closeContextMenu()
      openMerknadModal(cell.dataset.merknadRowId)
    })
  })
}

function openMerknadModal(rowId) {
  const row = findOrderRow(rowId)
  if (!row) return

  const modal = document.getElementById('modal')
  if (!modal) return

  modal.classList.remove('hidden')

  modal.innerHTML = `
    <div class="modal-content merknad-modal-content">
      <div class="modal-header">
        <div>
          <h3>Merknad</h3>
          <div class="modal-cell-key">
            ${escapeHtml(row.customerName || 'Uten kunde')}
          </div>
        </div>

        <button id="closeMerknadModal" class="modal-close" type="button">
          ×
        </button>
      </div>

      <textarea
        id="merknadTextarea"
        class="merknad-textarea"
        placeholder="Skriv merknad..."
      >${escapeHtml(row.merknad || '')}</textarea>

      <div class="modal-actions">
        <button id="cancelMerknadBtn" class="secondary-btn" type="button">
          Avbryt
        </button>

        <button id="saveMerknadBtn" class="primary-btn" type="button">
          Lagre
        </button>
      </div>
    </div>
  `

  const textarea = document.getElementById('merknadTextarea')

  textarea.focus()
  textarea.setSelectionRange(textarea.value.length, textarea.value.length)

  document.getElementById('closeMerknadModal').onclick = closeModal
  document.getElementById('cancelMerknadBtn').onclick = closeModal

  document.getElementById('saveMerknadBtn').onclick = () => {
    updateOrderRowField(rowId, 'merknad', textarea.value.trim())

    closeModal()
    renderTable()
  }
}

/* ===== COMMON ===== */

function closeModal() {
  const modal = document.getElementById('modal')
  if (!modal) return

  modal.classList.add('hidden')
  modal.innerHTML = ''
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}