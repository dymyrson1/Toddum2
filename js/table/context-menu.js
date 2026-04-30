import { state, deleteCell } from '../state.js'
import { openModal } from '../modal/modal.js'
import { renderTable } from './table-render.js'
import { copyCell, pasteCell, hasCopiedCell } from './clipboard.js'

let activeCellKey = null

export function openContextMenu(event, key) {
  event.preventDefault()

  activeCellKey = key
  state.selectedCellKey = key

  const menu = document.getElementById('contextMenu')
  if (!menu) return

  menu.classList.remove('hidden')
  menu.style.left = `${event.clientX}px`
  menu.style.top = `${event.clientY}px`

  updatePasteButton()
  markSelectedCell(key)
}

export function initContextMenu() {
  const menu = document.getElementById('contextMenu')
  if (!menu) return

  menu.addEventListener('click', event => {
    const button = event.target.closest('button')
    if (!button) return

    const action = button.dataset.action
    if (!action || !activeCellKey) return

    if (action === 'edit') {
      closeContextMenu()
      openModal(activeCellKey)
      return
    }

    if (action === 'clear') {
      const confirmed = confirm('Очистити цю клітинку?')

      if (confirmed) {
        deleteCell(activeCellKey)
        closeContextMenu()
        renderTable()
      }

      return
    }

    if (action === 'copy') {
      copyCell(activeCellKey)
      closeContextMenu()
      return
    }

    if (action === 'paste') {
      pasteCell(activeCellKey)
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
  activeCellKey = null
}

function markSelectedCell(key) {
  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.classList.remove('selected')
  })

  const cell = document.querySelector(`.editable-cell[data-key="${cssEscape(key)}"]`)
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