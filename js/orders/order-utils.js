import { createRowId } from '../utils/id.js'

export function createEmptyOrderRow() {
  return {
    id: createRowId(),
    customerName: '',
    deliveryDay: '',
    merknad: '',
    cells: {},
    checks: createEmptyChecks()
  }
}

export function createMigratedOrderRow(customerName) {
  return {
    id: createRowId(),
    customerName,
    deliveryDay: '',
    merknad: '',
    cells: {},
    checks: createEmptyChecks()
  }
}

export function normalizeOrderRows(rows, normalizeCells) {
  const list = Array.isArray(rows) ? rows : []

  return list.map(row => normalizeOrderRow(row, normalizeCells))
}

export function normalizeOrderRow(row, normalizeCells) {
  const cells =
    typeof normalizeCells === 'function'
      ? normalizeCells(row?.cells || {})
      : row?.cells || {}

  return {
    id: row?.id || createRowId(),
    customerName: row?.customerName || '',
    deliveryDay: row?.deliveryDay || '',
    merknad: row?.merknad || '',
    cells,
    checks: normalizeRowChecks(row?.checks)
  }
}

export function normalizeRowChecks(checks) {
  return {
    A: Boolean(checks?.A),
    B: Boolean(checks?.B)
  }
}

function createEmptyChecks() {
  return {
    A: false,
    B: false
  }
}