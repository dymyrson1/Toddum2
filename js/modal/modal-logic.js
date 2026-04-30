import {
  getOrderCell,
  updateOrderCell,
  findOrderRow,
  getPackagingOptionsForProduct
} from '../state.js'

import { closeModal } from './modal.js'
import { renderTable } from '../table/table-render.js'

let activeRowId = null
let activeProductName = null

export function renderModalContent(rowId, productName) {
  activeRowId = rowId
  activeProductName = productName

  const body = document.getElementById('modalBody')
  if (!body) return

  const row = findOrderRow(rowId)
  const data = getOrderCell(rowId, productName)

  const rows = data.items && data.items.length
    ? cloneData(data.items)
    : [createMiniRow()]

  body.innerHTML = `
    <div class="modal-header">
      <h3>Редагування</h3>
      <button id="modalCloseBtn" class="modal-close">×</button>
    </div>

    <div class="modal-cell-key">
      ${escapeHtml(row?.customerName || 'Без замовника')} — ${escapeHtml(productName)}
    </div>

    <table id="miniTable">
      <thead>
        <tr>
          <th>Тип упаковки</th>
          <th>Кількість</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>

    <button id="addRowBtn" class="secondary-btn">+ Додати рядок</button>

    <div class="modal-actions">
      <button id="saveModalBtn" class="primary-btn">Зберегти</button>
      <button id="cancelModalBtn" class="secondary-btn">Скасувати</button>
    </div>
  `

  renderMiniRows(rows)
  attachModalEvents(rows)
}

function renderMiniRows(rows) {
  const tbody = document.querySelector('#miniTable tbody')
  if (!tbody) return

  tbody.innerHTML = ''

  rows.forEach((row, index) => {
    ensureRowHasValidSelection(rows, index)

    const availableOptions = getAvailableOptionsForRow(rows, index)
    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>
        <select data-index="${index}" data-field="packageId" ${availableOptions.length === 0 ? 'disabled' : ''}>
          ${availableOptions.length === 0
            ? `<option value="">Немає доступних варіантів</option>`
            : availableOptions.map(option => `
                <option
                  value="${escapeHtml(option.id)}"
                  ${option.id === row.packageId ? 'selected' : ''}
                >
                  ${escapeHtml(option.label)}
                </option>
              `).join('')
          }
        </select>
      </td>

      <td>
        <input
          type="number"
          value="${row.qty || ''}"
          data-index="${index}"
          data-field="qty"
          min="0"
          step="0.01"
          placeholder="0"
        >
      </td>

      <td>
        <button class="remove-row-btn" data-remove="${index}">×</button>
      </td>
    `

    tbody.appendChild(tr)
  })

  updateAddRowButtonState(rows)
}

function attachModalEvents(rows) {
  document.querySelectorAll('#miniTable select[data-field="packageId"]').forEach(select => {
    select.addEventListener('change', () => {
      const index = Number(select.dataset.index)
      const selectedOption = getPackagingOptionsForProduct(activeProductName)
        .find(option => option.id === select.value)

      if (!selectedOption) return

      applyOptionToRow(rows[index], selectedOption)
      renderMiniRows(rows)
      attachModalEvents(rows)
    })
  })

  document.querySelectorAll('#miniTable input[data-field="qty"]').forEach(input => {
    input.addEventListener('input', () => {
      const index = Number(input.dataset.index)
      rows[index].qty = input.value
    })
  })

  document.querySelectorAll('.remove-row-btn').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.remove)

      rows.splice(index, 1)

      if (rows.length === 0) {
        rows.push(createMiniRow())
      }

      renderMiniRows(rows)
      attachModalEvents(rows)
    })
  })

  document.getElementById('addRowBtn').onclick = () => {
    const availableForNewRow = getAvailableOptionsForNewRow(rows)

    if (availableForNewRow.length === 0) {
      alert('Усі типи упаковки для цього продукту вже використані')
      return
    }

    const newRow = createMiniRow()
    applyOptionToRow(newRow, availableForNewRow[0])

    rows.push(newRow)

    renderMiniRows(rows)
    attachModalEvents(rows)
  }

  document.getElementById('saveModalBtn').onclick = () => {
    saveRows(rows)
  }

  document.getElementById('cancelModalBtn').onclick = closeModal
  document.getElementById('modalCloseBtn').onclick = closeModal
}

function ensureRowHasValidSelection(rows, index) {
  const row = rows[index]
  const availableOptions = getAvailableOptionsForRow(rows, index)

  if (availableOptions.length === 0) {
    row.packageId = ''
    row.packageName = ''
    row.weightKg = 0
    row.label = ''
    return
  }

  const currentStillAvailable = availableOptions
    .some(option => option.id === row.packageId)

  if (currentStillAvailable) return

  applyOptionToRow(row, availableOptions[0])
}

function getAvailableOptionsForRow(rows, index) {
  const allOptions = getPackagingOptionsForProduct(activeProductName)
  const selectedInOtherRows = new Set(
    rows
      .filter((_, rowIndex) => rowIndex !== index)
      .map(row => row.packageId)
      .filter(Boolean)
  )

  return allOptions.filter(option => {
    if (option.id === rows[index].packageId) return true
    return !selectedInOtherRows.has(option.id)
  })
}

function getAvailableOptionsForNewRow(rows) {
  const allOptions = getPackagingOptionsForProduct(activeProductName)
  const selected = new Set(rows.map(row => row.packageId).filter(Boolean))

  return allOptions.filter(option => !selected.has(option.id))
}

function applyOptionToRow(row, option) {
  row.packageId = option.id
  row.packageName = option.packageName
  row.weightKg = option.weightKg
  row.label = option.label
}

function createMiniRow() {
  return {
    packageId: '',
    packageName: '',
    weightKg: 0,
    label: '',
    qty: ''
  }
}

function updateAddRowButtonState(rows) {
  const button = document.getElementById('addRowBtn')
  if (!button) return

  const hasOptions = getAvailableOptionsForNewRow(rows).length > 0
  button.disabled = !hasOptions
}

function saveRows(rows) {
  const cleanRows = rows
    .map(row => ({
      packageId: String(row.packageId || '').trim(),
      packageName: String(row.packageName || '').trim(),
      weightKg: Number(row.weightKg) || 0,
      label: String(row.label || '').trim(),
      qty: Number(row.qty)
    }))
    .filter(row => row.packageId && row.qty > 0)
    .sort((a, b) => a.weightKg - b.weightKg || a.label.localeCompare(b.label))

  updateOrderCell(activeRowId, activeProductName, {
    items: cleanRows
  })

  renderTable()
  closeModal()
}

function cloneData(data) {
  if (typeof structuredClone === 'function') {
    return structuredClone(data)
  }

  return JSON.parse(JSON.stringify(data))
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}