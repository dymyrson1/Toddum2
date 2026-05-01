import { deleteOrderCell, state } from '../state.js'

import { renderTable } from './table-render.js'
import { closeContextMenu } from './context-menu.js'
import { initTableKeyboardController } from './table-keyboard.js'

import { handleTableClick } from './table-click-events.js'
import { handleTableChange } from './table-change-events.js'
import { handleTableContextMenu } from './table-contextmenu-events.js'

let tableEventsInitialized = false

export function attachTableEvents() {
  initTableEvents()
}

export function initTableKeyboardEvents() {
  initTableKeyboardController({
    state,
    deleteOrderCell,
    closeContextMenu,
    renderTable
  })
}

function initTableEvents() {
  if (tableEventsInitialized) return

  document.addEventListener('click', handleTableClick)
  document.addEventListener('change', handleTableChange)
  document.addEventListener('contextmenu', handleTableContextMenu)

  tableEventsInitialized = true
}
