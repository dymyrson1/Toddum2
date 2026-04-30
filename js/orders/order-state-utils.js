export function findOrderRowById(rows, rowId) {
  if (!Array.isArray(rows)) return null

  return rows.find(row => row.id === rowId) || null
}

export function removeOrderRowById(rows, rowId) {
  if (!Array.isArray(rows)) {
    return {
      removed: false,
      row: null,
      index: -1
    }
  }

  const index = rows.findIndex(row => row.id === rowId)

  if (index === -1) {
    return {
      removed: false,
      row: null,
      index: -1
    }
  }

  const row = rows[index]

  rows.splice(index, 1)

  return {
    removed: true,
    row,
    index
  }
}

export function updateOrderRowFieldValue(row, field, value) {
  if (!row) {
    return {
      changed: false,
      oldValue: '',
      newValue: ''
    }
  }

  const oldValue = row[field] || ''
  const newValue = value || ''

  if (oldValue === newValue) {
    return {
      changed: false,
      oldValue,
      newValue
    }
  }

  row[field] = newValue

  return {
    changed: true,
    oldValue,
    newValue
  }
}

export function updateOrderRowCheckValue(row, checkType, checked) {
  if (!row) {
    return {
      changed: false,
      oldValue: false,
      newValue: false
    }
  }

  if (!row.checks) {
    row.checks = {
      A: false,
      B: false
    }
  }

  const oldValue = Boolean(row.checks[checkType])
  const newValue = Boolean(checked)

  if (oldValue === newValue) {
    return {
      changed: false,
      oldValue,
      newValue
    }
  }

  row.checks[checkType] = newValue

  return {
    changed: true,
    oldValue,
    newValue
  }
}