import { state, deleteOrderCell } from '../state.js'
import { openProductModal } from '../modal/product-modal.js'
import { renderTable } from './table-render.js'
import { copyCell, hasCopiedCell, pasteCell } from './clipboard.js'
import { selectProductCell } from './table-selection.js'

let activeRowId = null
let activeProductName = null
let contextMenuInitialized = false

export function openContextMenu(event, rowId, productName) {
  event.preventDefault()

  activeRowId = rowId
  activeProductName = productName

  selectProductCell(state, rowId, productName)

  const menu = getContextMenu()

  if (!menu) return

  menu.classList.remove('hidden')
  menu.style.left = `${event.clientX}px`
  menu.style.top = `${event.clientY}px`

  updatePasteButton(menu)
}

export function initContextMenu() {
  if (contextMenuInitialized) return

  const menu = getContextMenu()

  if (!menu) return

  menu.addEventListener('click', handleContextMenuClick)

  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('scroll', closeContextMenu, true)
  document.addEventListener('keydown', handleEscapeKey)
  window.addEventListener('resize', closeContextMenu)

  contextMenuInitialized = true
}

export function closeContextMenu() {
  const menu = getContextMenu()

  if (!menu) return

  menu.classList.add('hidden')

  activeRowId = null
  activeProductName = null
}

function handleContextMenuClick(event) {
  const button = event.target.closest('button[data-action]')

  if (!button) return
  if (!activeRowId || !activeProductName) return

  const action = button.dataset.action

  if (action === 'edit') {
    closeContextMenu()
    openProductModal(activeRowId, activeProductName)
    return
  }

  if (action === 'clear') {
    const confirmed = confirm('Vil du tømme denne cellen?')

    if (!confirmed) return

    deleteOrderCell(activeRowId, activeProductName)
    closeContextMenu()
    renderTable()
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
    renderTable()
  }
}

function handleDocumentClick(event) {
  const menu = getContextMenu()

  if (!menu) return
  if (menu.classList.contains('hidden')) return
  if (menu.contains(event.target)) return
  if (event.target.closest('.editable-cell')) return

  closeContextMenu()
}

function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    closeContextMenu()
  }
}

function updatePasteButton(menu) {
  const pasteButton = menu.querySelector('[data-action="paste"]')

  if (!pasteButton) return

  pasteButton.disabled = !hasCopiedCell()
}

function getContextMenu() {
  return document.getElementById('contextMenu')
}
