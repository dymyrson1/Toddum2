import { state, updateCheck, deleteCell } from '../state.js'
import { openModal } from '../modal/modal.js'
import { openContextMenu, closeContextMenu } from './context-menu.js'
import { copyCell, pasteCell } from './clipboard.js'
import { renderTable } from './table-render.js'

let keyboardEventsInitialized = false

export function attachTableEvents() {
  attachCellEvents()
  attachCheckboxEvents()
}

export function initTableKeyboardEvents() {
  if (keyboardEventsInitialized) return

  document.addEventListener('keydown', handleTableKeydown)
  keyboardEventsInitialized = true
}

function attachCellEvents() {
  document.querySelectorAll('.editable-cell[data-key]').forEach(cell => {
    cell.addEventListener('click', () => {
      closeContextMenu()

      const key = cell.dataset.key
      selectCell(key)
      openModal(key)
    })

    cell.addEventListener('contextmenu', event => {
      const key = cell.dataset.key
      selectCell(key)
      openContextMenu(event, key)
    })
  })
}

function attachCheckboxEvents() {
  document.querySelectorAll('input[data-check]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      closeContextMenu()

      const confirmed = confirm('Підтвердити зміну?')

      if (!confirmed) {
        checkbox.checked = !checkbox.checked
        return
      }

      const [customer, checkType] = checkbox.dataset.check.split('__')

      updateCheck(customer, checkType, checkbox.checked)
    })
  })
}

function handleTableKeydown(event) {
  const modal = document.getElementById('modal')
  const modalIsOpen = modal && !modal.classList.contains('hidden')

  if (modalIsOpen) return
  if (!state.selectedCellKey) return

  const key = event.key.toLowerCase()

  if ((event.metaKey || event.ctrlKey) && key === 'c') {
    event.preventDefault()
    copyCell(state.selectedCellKey)
    return
  }

  if ((event.metaKey || event.ctrlKey) && key === 'v') {
    event.preventDefault()
    pasteCell(state.selectedCellKey)
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()

    const confirmed = confirm('Очистити вибрану клітинку?')
    if (!confirmed) return

    deleteCell(state.selectedCellKey)
    closeContextMenu()
    renderTable()
  }
}

function selectCell(key) {
  state.selectedCellKey = key

  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.classList.remove('selected')
  })

  const cell = document.querySelector(`.editable-cell[data-key="${cssEscape(key)}"]`)
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