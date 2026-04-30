import {
  addOrderRow,
  deleteOrderCell,
  deleteOrderRow,
  state,
  updateOrderRowField,
  updateRowCheck
} from '../state.js'

import { openMerknadModal } from '../modal/merknad-modal.js'
import { openProductModal } from '../modal/product-modal.js'
import { closeContextMenu } from './context-menu.js'
import { renderTable } from './table-render.js'

let keyboardEventsInitialized = false

export function attachTableEvents() {
  attachCellEvents()
  attachRowFieldEvents()
  attachCheckboxEvents()
  attachDeleteRowEvents()
  attachAddRowEvent()
  attachMerknadEvents()
}

export function initTableKeyboardEvents() {
  if (keyboardEventsInitialized) return

  document.addEventListener('keydown', handleTableKeydown)

  keyboardEventsInitialized = true
}

function handleTableKeydown(event) {
  const target = event.target

  if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
    return
  }

  if (!state.selectedCell) return
  if (event.key !== 'Delete' && event.key !== 'Backspace') return

  event.preventDefault()

  const confirmed = confirm('Vil du tømme denne cellen?')

  if (!confirmed) return

  deleteOrderCell(state.selectedCell.rowId, state.selectedCell.productName)

  renderTable()
}

function attachCellEvents() {
  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.onclick = () => {
      closeContextMenu()

      const rowId = cell.dataset.rowId
      const productName = cell.dataset.product || cell.dataset.productName

      if (!rowId || !productName) return

      state.selectedCell = {
        rowId,
        productName
      }

      openProductModal(rowId, productName)
    }
  })
}

function attachRowFieldEvents() {
  document.querySelectorAll('[data-row-field]').forEach(field => {
    field.onchange = () => {
      closeContextMenu()

      updateOrderRowField(field.dataset.rowId, field.dataset.rowField, field.value)

      renderTable()
    }
  })
}

function attachCheckboxEvents() {
  document.querySelectorAll('input[data-row-check]').forEach(checkbox => {
    checkbox.onchange = () => {
      closeContextMenu()

      const confirmed = confirm('Vil du endre avkryssingen?')

      if (!confirmed) {
        checkbox.checked = !checkbox.checked
        return
      }

      updateRowCheck(
        checkbox.dataset.rowId,
        checkbox.dataset.rowCheck,
        checkbox.checked
      )

      renderTable()
    }
  })
}

function attachDeleteRowEvents() {
  document.querySelectorAll('[data-delete-row]').forEach(button => {
    button.onclick = () => {
      closeContextMenu()

      const confirmed = confirm('Vil du slette hele raden?')

      if (!confirmed) return

      deleteOrderRow(button.dataset.deleteRow)
      renderTable()
    }
  })
}

function attachAddRowEvent() {
  const button = document.getElementById('addOrderRowBtn')

  if (!button) return

  button.onclick = () => {
    closeContextMenu()

    const row = addOrderRow()

    if (row) {
      renderTable()
    }
  }
}

function attachMerknadEvents() {
  document.querySelectorAll('[data-merknad-row-id]').forEach(cell => {
    cell.onclick = () => {
      closeContextMenu()
      openMerknadModal(cell.dataset.merknadRowId)
    }
  })
}