import { createEmptyOrderRow } from './order-utils.js'

import {
  findOrderRowById,
  removeOrderRowById,
  updateOrderRowCheckValue,
  updateOrderRowFieldValue
} from './order-state-utils.js'

export function addOrderRowAction(context) {
  const { addLog, getCurrentRows, persistState } = context

  const rows = getCurrentRows()
  const row = createEmptyOrderRow()

  rows.push(row)

  if (typeof addLog === 'function') {
    addLog('add_row', {
      actionLabel: 'La til rad'
    })
  }

  persistState()

  return row
}

export function deleteOrderRowAction(context, rowId) {
  const { state, getCurrentRows, persistState } = context

  const result = removeOrderRowById(getCurrentRows(), rowId)

  if (!result.removed) return

  if (state.selectedCell?.rowId === rowId) {
    state.selectedCell = null
  }

  persistState()
}

export function updateOrderRowFieldAction(context, rowId, field, value) {
  const { ensureCustomerExists, persistState } = context

  const row = findOrderRowAction(context, rowId)
  const result = updateOrderRowFieldValue(row, field, value)

  if (!result.changed) return

  if (field === 'customerName' && result.newValue) {
    ensureCustomerExists(result.newValue)
  }

  persistState()
}

export function updateRowCheckAction(context, rowId, checkType, checked) {
  const { persistState } = context

  const row = findOrderRowAction(context, rowId)
  const result = updateOrderRowCheckValue(row, checkType, checked)

  if (!result.changed) return

  persistState()
}

export function findOrderRowAction(context, rowId) {
  const { getCurrentRows } = context

  return findOrderRowById(getCurrentRows(), rowId)
}
