import { formatCellForLog } from '../products/packaging-utils.js'
import { normalizeOrderCellItems } from './order-cell-utils.js'
import { createEmptyOrderRow } from './order-utils.js'

import {
  findOrderRowById,
  removeOrderRowById,
  updateOrderRowCheckValue,
  updateOrderRowFieldValue
} from './order-state-utils.js'

export function addOrderRowAction(context) {
  const { getCurrentRows, addLog, persistState } = context

  const rows = getCurrentRows()
  const row = createEmptyOrderRow()

  rows.push(row)

  addLog('add_row', {
    actionLabel: 'La til rad'
  })

  persistState()

  return row
}

export function deleteOrderRowAction(context, rowId) {
  const { state, getCurrentRows, addLog, persistState } = context

  const result = removeOrderRowById(getCurrentRows(), rowId)

  if (!result.removed) return

  if (state.selectedCell?.rowId === rowId) {
    state.selectedCell = null
  }

  addLog('delete_row', {
    actionLabel: 'Slettet rad',
    customerName: result.row.customerName || '',
    deliveryDay: result.row.deliveryDay || ''
  })

  persistState()
}

export function updateOrderRowFieldAction(context, rowId, field, value) {
  const { ensureCustomerExists, addLog, persistState } = context

  const row = findOrderRowAction(context, rowId)
  const result = updateOrderRowFieldValue(row, field, value)

  if (!result.changed) return

  if (field === 'customerName' && result.newValue) {
    ensureCustomerExists(result.newValue)
  }

  addLog('update_row_field', {
    actionLabel: field === 'customerName' ? 'Endret kunde' : 'Endret leveringsdag',
    customerName: field === 'customerName' ? result.newValue : row.customerName || '',
    deliveryDay: field === 'deliveryDay' ? result.newValue : row.deliveryDay || '',
    oldValue: result.oldValue,
    newValue: result.newValue
  })

  persistState()
}

export function updateOrderCellAction(context, rowId, productName, value) {
  const { getPackagingOptionsForProduct, addLog, persistState } = context

  const row = findOrderRowAction(context, rowId)

  if (!row) return

  if (!row.cells) {
    row.cells = {}
  }

  const oldItems = row.cells[productName]?.items || []
  const oldValue = formatCellForLog(oldItems)

  const cleanItems = normalizeOrderCellItems(
    value?.items || [],
    getPackagingOptionsForProduct(productName)
  )

  const newValue = formatCellForLog(cleanItems)

  if (oldValue === newValue) return

  if (cleanItems.length === 0) {
    delete row.cells[productName]
  } else {
    row.cells[productName] = {
      items: cleanItems
    }
  }

  addLog('update_cell', {
    actionLabel: oldValue ? 'Endret produktcelle' : 'La til produktcelle',
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    productName,
    oldValue,
    newValue
  })

  persistState()
}

export function deleteOrderCellAction(context, rowId, productName) {
  const { addLog, persistState } = context

  const row = findOrderRowAction(context, rowId)

  if (!row || !row.cells) return

  const oldItems = row.cells[productName]?.items || []
  const oldValue = formatCellForLog(oldItems)

  if (!oldValue) return

  delete row.cells[productName]

  addLog('delete_cell', {
    actionLabel: 'Tømte produktcelle',
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    productName,
    oldValue,
    newValue: ''
  })

  persistState()
}

export function updateRowCheckAction(context, rowId, checkType, checked) {
  const { addLog, persistState } = context

  const row = findOrderRowAction(context, rowId)
  const result = updateOrderRowCheckValue(row, checkType, checked)

  if (!result.changed) return

  addLog('update_check', {
    actionLabel: `Endret avkryssing ${checkType}`,
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    oldValue: result.oldValue ? 'På' : 'Av',
    newValue: result.newValue ? 'På' : 'Av'
  })

  persistState()
}

export function findOrderRowAction(context, rowId) {
  const { getCurrentRows } = context

  return findOrderRowById(getCurrentRows(), rowId)
}

export function getOrderCellAction(context, rowId, productName) {
  const { getPackagingOptionsForProduct } = context

  const row = findOrderRowAction(context, rowId)

  if (!row || !row.cells) {
    return {
      items: []
    }
  }

  const cell = row.cells[productName] || {
    items: []
  }

  return {
    items: normalizeOrderCellItems(
      cell.items || [],
      getPackagingOptionsForProduct(productName)
    )
  }
}
