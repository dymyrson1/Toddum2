export function isFormControlTarget(target) {
  return Boolean(
    target && ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)
  )
}

export function getProductCellFromEvent(event) {
  return event.target.closest('.editable-cell')
}

export function getProductCellIdentity(cell) {
  if (!cell) return null

  const rowId = cell.dataset.rowId
  const productName = cell.dataset.product || cell.dataset.productName

  if (!rowId || !productName) return null

  return {
    rowId,
    productName
  }
}

export function getRowFieldFromEvent(event) {
  return event.target.closest('[data-row-field]')
}

export function getRowFieldIdentity(field) {
  if (!field) return null

  const rowId = field.dataset.rowId
  const rowField = field.dataset.rowField

  if (!rowId || !rowField) return null

  return {
    rowId,
    rowField,
    value: field.value
  }
}

export function getCheckboxFromEvent(event) {
  return event.target.closest('input[data-row-check]')
}

export function getCheckboxIdentity(checkbox) {
  if (!checkbox) return null

  const rowId = checkbox.dataset.rowId
  const rowCheck = checkbox.dataset.rowCheck

  if (!rowId || !rowCheck) return null

  return {
    rowId,
    rowCheck,
    checked: checkbox.checked
  }
}

export function getDeleteRowButtonFromEvent(event) {
  return event.target.closest('[data-delete-row]')
}

export function getDeleteRowId(button) {
  return button?.dataset.deleteRow || ''
}

export function getMerknadCellFromEvent(event) {
  return event.target.closest('[data-merknad-row-id]')
}

export function getMerknadRowId(cell) {
  return cell?.dataset.merknadRowId || ''
}

export function isAddRowButtonFromEvent(event) {
  return Boolean(event.target.closest('#addOrderRowBtn'))
}
