import {
  state,
  addOrderRow,
  deleteOrderRow,
  updateOrderRowField,
  updateRowCheck,
  deleteOrderCell
} from '../state.js'

import { openModal } from '../modal/modal.js'
import { openContextMenu, closeContextMenu } from './context-menu.js'
import { copyCell, pasteCell } from './clipboard.js'
import { renderTable } from './table-render.js'

let keyboardEventsInitialized = false

export function attachTableEvents() {
  attachAddRowEvent()
  attachRowFieldEvents()
  attachCellEvents()
  attachCheckboxEvents()
  attachDeleteRowEvents()
}

export function initTableKeyboardEvents() {
  if (keyboardEventsInitialized) return

  document.addEventListener('keydown', handleTableKeydown)
  keyboardEventsInitialized = true
}

function attachAddRowEvent() {
  const button = document.getElementById('addOrderRowBtn')
  if (!button) return

  button.onclick = () => {
    addOrderRow()
    renderTable()
  }
}

function attachRowFieldEvents() {
  document.querySelectorAll('[data-row-field]').forEach(field => {
    field.addEventListener('change', () => {
      const rowId = field.dataset.rowId
      const fieldName = field.dataset.rowField

      updateOrderRowField(rowId, fieldName, field.value)
    })

    field.addEventListener('blur', () => {
      const rowId = field.dataset.rowId
      const fieldName = field.dataset.rowField

      updateOrderRowField(rowId, fieldName, field.value)
    })
  })
}

function attachCellEvents() {
  document.querySelectorAll('.editable-cell[data-row-id][data-product]').forEach(cell => {
    cell.addEventListener('click', () => {
      closeContextMenu()

      const rowId = cell.dataset.rowId
      const productName = cell.dataset.product

      selectCell(rowId, productName)
      openModal(rowId, productName)
    })

    cell.addEventListener('contextmenu', event => {
      const rowId = cell.dataset.rowId
      const productName = cell.dataset.product

      selectCell(rowId, productName)
      openContextMenu(event, rowId, productName)
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
    button.onclick = () => {
      const rowId = button.dataset.deleteRow
      const confirmed = confirm('Видалити цей рядок?')

      if (!confirmed) return

      deleteOrderRow(rowId)
      closeContextMenu()
      renderTable()
    }
  })
}

function handleTableKeydown(event) {
  const modal = document.getElementById('modal')
  const modalIsOpen = modal && !modal.classList.contains('hidden')

  if (modalIsOpen) return
  if (isTypingInsideField(event.target)) return
  if (!state.selectedCell) return

  const key = event.key.toLowerCase()

  if ((event.metaKey || event.ctrlKey) && key === 'c') {
    event.preventDefault()
    copyCell(state.selectedCell.rowId, state.selectedCell.productName)
    return
  }

  if ((event.metaKey || event.ctrlKey) && key === 'v') {
    event.preventDefault()
    pasteCell(state.selectedCell.rowId, state.selectedCell.productName)
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()

    const confirmed = confirm('Очистити вибрану клітинку?')
    if (!confirmed) return

    deleteOrderCell(state.selectedCell.rowId, state.selectedCell.productName)
    closeContextMenu()
    renderTable()
  }
}

function isTypingInsideField(target) {
  if (!target) return false

  const tagName = target.tagName?.toLowerCase()

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  )
}

function selectCell(rowId, productName) {
  state.selectedCell = {
    rowId,
    productName
  }

  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.classList.remove('selected')
  })

  const cell = document.querySelector(
    `.editable-cell[data-row-id="${cssEscape(rowId)}"][data-product="${cssEscape(productName)}"]`
  )

  if (cell) {
    cell.classList.add('selected')
  }
}

function cssEscape(value) {
  if (window.CSS && CSS.escape) {
    return CSS.escape(value)
  }

  return String(value).replaceAll('"', '\\"')
}