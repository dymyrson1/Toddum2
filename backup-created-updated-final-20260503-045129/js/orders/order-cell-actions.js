import { formatCellForLog } from '../products/packaging-utils.js'
import { normalizeOrderCellItems } from './order-cell-utils.js'
import { findOrderRowAction } from './order-row-actions.js'

export function updateOrderCellAction(context, rowId, productName, value) {
  const { getPackagingOptionsForProduct, persistState } = context

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

  persistState()
}

export function deleteOrderCellAction(context, rowId, productName) {
  const { persistState } = context

  const row = findOrderRowAction(context, rowId)

  if (!row || !row.cells) return

  const oldItems = row.cells[productName]?.items || []
  const oldValue = formatCellForLog(oldItems)

  if (!oldValue) return

  delete row.cells[productName]

  persistState()
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
