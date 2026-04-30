export function selectProductCell(state, rowId, productName) {
  state.selectedCell = {
    rowId,
    productName
  }

  clearSelectedProductCells()

  const cell = findProductCell(rowId, productName)

  if (cell) {
    cell.classList.add('selected')
  }
}

export function clearSelectedProductCells() {
  document.querySelectorAll('.editable-cell.selected').forEach(cell => {
    cell.classList.remove('selected')
  })
}

export function getSelectedProductCell(state) {
  const rowId = state.selectedCell?.rowId
  const productName = state.selectedCell?.productName

  if (!rowId || !productName) return null

  return {
    rowId,
    productName
  }
}

function findProductCell(rowId, productName) {
  return (
    document.querySelector(
      `.editable-cell[data-row-id="${escapeForSelector(rowId)}"][data-product="${escapeForSelector(
        productName
      )}"]`
    ) ||
    document.querySelector(
      `.editable-cell[data-row-id="${escapeForSelector(
        rowId
      )}"][data-product-name="${escapeForSelector(productName)}"]`
    )
  )
}

function escapeForSelector(value) {
  if (window.CSS && CSS.escape) {
    return CSS.escape(value)
  }

  return String(value).replaceAll('"', '\\"')
}