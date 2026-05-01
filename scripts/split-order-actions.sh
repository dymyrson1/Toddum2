#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split order-actions.js into row and cell action modules"
echo ""

FILES=(
  "js/orders/order-actions.js"
  "js/orders/order-row-actions.js"
  "js/orders/order-cell-actions.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-order-actions.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/orders

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/orders/order-actions.js <<'JS'
export {
  addOrderRowAction,
  deleteOrderRowAction,
  findOrderRowAction,
  updateOrderRowFieldAction,
  updateRowCheckAction
} from './order-row-actions.js'

export {
  deleteOrderCellAction,
  getOrderCellAction,
  updateOrderCellAction
} from './order-cell-actions.js'
JS

cat > js/orders/order-row-actions.js <<'JS'
import { createEmptyOrderRow } from './order-utils.js'

import {
  findOrderRowById,
  removeOrderRowById,
  updateOrderRowCheckValue,
  updateOrderRowFieldValue
} from './order-state-utils.js'

export function addOrderRowAction(context) {
  const { getCurrentRows, persistState } = context

  const rows = getCurrentRows()
  const row = createEmptyOrderRow()

  rows.push(row)

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
JS

cat > js/orders/order-cell-actions.js <<'JS'
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
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
