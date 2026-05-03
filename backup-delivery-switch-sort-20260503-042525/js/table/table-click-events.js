import { addOrderRow, deleteOrderRow, state } from '../state.js'
import { openMerknadModal } from '../modal/merknad-modal.js'
import { openProductModal } from '../modal/product-modal.js'
import { closeContextMenu } from './context-menu.js'
import { renderTable } from './table-render.js'
import {
  getDeleteRowButtonFromEvent,
  getDeleteRowId,
  getMerknadCellFromEvent,
  getMerknadRowId,
  getProductCellFromEvent,
  getProductCellIdentity,
  isAddRowButtonFromEvent
} from './table-event-targets.js'
import { confirmDeleteRow } from './table-confirmation.js'
import { selectProductCell } from './table-selection.js'
import { toggleTableSort } from './table-sort.js'

export function handleTableClick(event) {
  if (handleTableSortClick(event)) return
  if (handleAddRowClick(event)) return
  if (handleDeleteRowClick(event)) return
  if (handleMerknadClick(event)) return
  if (handleProductCellClick(event)) return
}

export function handleTableSortClick(event) {
  const button = event.target.closest('[data-sort-key]')

  if (!button) return false

  closeContextMenu()
  toggleTableSort(button.dataset.sortKey)
  renderTable()

  return true
}

export function handleProductCellClick(event) {
  const cell = getProductCellFromEvent(event)
  const identity = getProductCellIdentity(cell)

  if (!identity) return false

  closeContextMenu()
  selectProductCell(state, identity.rowId, identity.productName)
  openProductModal(identity.rowId, identity.productName)

  return true
}

export function handleDeleteRowClick(event) {
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

export function handleAddRowClick(event) {
  if (!isAddRowButtonFromEvent(event)) return false

  closeContextMenu()

  const row = addOrderRow()

  if (row) {
    renderTable()
  }

  return true
}

export function handleMerknadClick(event) {
  const cell = getMerknadCellFromEvent(event)
  const rowId = getMerknadRowId(cell)

  if (!rowId) return false

  closeContextMenu()
  openMerknadModal(rowId)

  return true
}
