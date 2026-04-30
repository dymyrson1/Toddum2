import { state, deleteOrderCell } from '../state.js'
import { openModal } from '../modal/modal.js'
import { renderTable } from './table-render.js'
import { copyCell, pasteCell, hasCopiedCell } from './clipboard.js'

let activeRowId = null
let activeProductName = null

export function openContextMenu(event, rowId, productName) {
  event.preventDefault()

  activeRowId = rowId
  activeProductName = productName

  state.selectedCell = {
    rowId,
    productName
  }

  const menu = document.getElementById('contextMenu')
  if (!menu) return

  menu.classList.remove('hidden')
  menu.style.left = `${event.clientX}px`
  menu.style.top = `${event.clientY}px`

  updatePasteButton()
  markSelectedCell(rowId, productName)
}

export function initContextMenu() {
  const menu = document.getElementById('contextMenu')
  if (!menu) return

  menu.addEventListener('click', event => {
    const button = event.target.closest('button')
    if (!button) return

    const action = button.dataset.action
    if (!action || !activeRowId || !activeProductName) return

    if (action === 'edit') {
      closeContextMenu()
      openModal(activeRowId, activeProductName)
      return
    }

    if (action === 'clear') {
      const confirmed = confirm('Очистити цю клітинку?')

      if (confirmed) {
        deleteOrderCell(activeRowId, activeProductName)
        closeContextMenu()
        renderTable()
      }

      return
    }

    if (action === 'copy') {
      copyCell(activeRowId, activeProductName)
      closeContextMenu()
      return
    }

    if (action === 'paste') {
      pasteCell(activeRowId, activeProductName)
      closeContextMenu()
      return
    }
  })

  document.addEventListener('click', event => {
    const target = event.target

    if (
      menu.classList.contains('hidden') ||
      menu.contains(target) ||
      target.closest('.editable-cell')
    ) {
      return
    }

    closeContextMenu()
  })

  document.addEventListener('scroll', () => {
    closeContextMenu()
  }, true)

  window.addEventListener('resize', () => {
    closeContextMenu()
  })

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeContextMenu()
    }
  })
}

export function closeContextMenu() {
  const menu = document.getElementById('contextMenu')
  if (!menu) return

  menu.classList.add('hidden')

  activeRowId = null
  activeProductName = null
}

function markSelectedCell(rowId, productName) {
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

function updatePasteButton() {
  const pasteButton = document.querySelector('[data-action="paste"]')
  if (!pasteButton) return

  pasteButton.disabled = !hasCopiedCell()
}

function cssEscape(value) {
  if (window.CSS && CSS.escape) {
    return CSS.escape(value)
  }

  return String(value).replaceAll('"', '\\"')
}