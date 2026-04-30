import {
  getOrderCell,
  updateOrderCell,
  findOrderRow,
  getPackagingTypesForProduct
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
    : [{ type: '', qty: '' }]

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
    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>
        <select data-index="${index}" data-field="type">
          <option value="">Обрати</option>
          ${renderPackagingOptions(activeProductName, row.type)}
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
}

function renderPackagingOptions(productName, selectedType) {
  const types = getPackagingTypesForProduct(productName)
  const normalizedTypes = [...types]

  if (selectedType && !normalizedTypes.includes(selectedType)) {
    normalizedTypes.push(selectedType)
  }

  return normalizedTypes.map(type => `
    <option 
      value="${escapeHtml(type)}" 
      ${type === selectedType ? 'selected' : ''}
    >
      ${escapeHtml(type)}
    </option>
  `).join('')
}

function attachModalEvents(rows) {
  document.querySelectorAll('#miniTable input, #miniTable select').forEach(input => {
    input.addEventListener('input', () => {
      const index = Number(input.dataset.index)
      const field = input.dataset.field

      rows[index][field] = input.value
    })

    input.addEventListener('change', () => {
      const index = Number(input.dataset.index)
      const field = input.dataset.field

      rows[index][field] = input.value
    })
  })

  document.querySelectorAll('.remove-row-btn').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.remove)

      rows.splice(index, 1)

      if (rows.length === 0) {
        rows.push({ type: '', qty: '' })
      }

      renderMiniRows(rows)
      attachModalEvents(rows)
    })
  })

  document.getElementById('addRowBtn').onclick = () => {
    rows.push({ type: '', qty: '' })
    renderMiniRows(rows)
    attachModalEvents(rows)
  }

  document.getElementById('saveModalBtn').onclick = () => {
    saveRows(rows)
  }

  document.getElementById('cancelModalBtn').onclick = closeModal
  document.getElementById('modalCloseBtn').onclick = closeModal
}

function saveRows(rows) {
  const cleanRows = rows
    .map(row => ({
      type: String(row.type || '').trim(),
      qty: Number(row.qty)
    }))
    .filter(row => row.type && row.qty > 0)

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