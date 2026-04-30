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

import {
  getCheckboxFromEvent,
  getCheckboxIdentity,
  getDeleteRowButtonFromEvent,
  getDeleteRowId,
  getMerknadCellFromEvent,
  getMerknadRowId,
  getProductCellFromEvent,
  getProductCellIdentity,
  getRowFieldFromEvent,
  getRowFieldIdentity,
  isAddRowButtonFromEvent
} from './table-event-targets.js'

import {
  confirmCheckboxChange,
  confirmDeleteRow
} from './table-confirmation.js'

import { selectProductCell } from './table-selection.js'
import { initTableKeyboardController } from './table-keyboard.js'

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

  tableEventsInitialized = true
}

function handleTableClick(event) {
  if (handleAddRowClick(event)) return
  if (handleDeleteRowClick(event)) return
  if (handleMerknadClick(event)) return
  if (handleProductCellClick(event)) return
}

function handleTableChange(event) {
  if (handleRowFieldChange(event)) return
  if (handleCheckboxChange(event)) return
}

function handleProductCellClick(event) {
  const cell = getProductCellFromEvent(event)
  const identity = getProductCellIdentity(cell)

  if (!identity) return false

  closeContextMenu()
  selectProductCell(state, identity.rowId, identity.productName)
  openProductModal(identity.rowId, identity.productName)

  return true
}

function handleRowFieldChange(event) {
  const field = getRowFieldFromEvent(event)
  const identity = getRowFieldIdentity(field)

  if (!identity) return false

  closeContextMenu()

  updateOrderRowField(identity.rowId, identity.rowField, identity.value)

  renderTable()

  return true
}

function handleCheckboxChange(event) {
  const checkbox = getCheckboxFromEvent(event)
  const identity = getCheckboxIdentity(checkbox)

  if (!identity) return false

  closeContextMenu()

  const confirmed = confirmCheckboxChange()

  if (!confirmed) {
    checkbox.checked = !checkbox.checked
    return true
  }

  updateRowCheck(identity.rowId, identity.rowCheck, identity.checked)

  renderTable()

  return true
}

function handleDeleteRowClick(event) {
  const button = getDeleteRowButtonFromEvent(event)
  const rowId = getDeleteRowId(button)

  if (!rowId) return false

  closeContextMenu()

  const confirmed = confirmDeleteRow()

  if (!confirmed) return true

  deleteOrderRow(rowId)
  renderTable()

  return true
}

function handleAddRowClick(event) {
  if (!isAddRowButtonFromEvent(event)) return false

  closeContextMenu()

  const row = addOrderRow()

  if (row) {
    renderTable()
  }

  return true
}

function handleMerknadClick(event) {
  const cell = getMerknadCellFromEvent(event)
  const rowId = getMerknadRowId(cell)

  if (!rowId) return false

  closeContextMenu()
  openMerknadModal(rowId)

  return true
}