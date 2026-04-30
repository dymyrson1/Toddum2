import { createMigratedOrderRow } from './order-utils.js'

export function migrateWeeksToRows(weeks) {
  Object.values(weeks || {}).forEach((week) => {
    if (Array.isArray(week.rows)) return

    week.rows = migrateCellsToOrderRows(week.cells || {})

    delete week.cells
  })

  return weeks || {}
}

export function migrateCellsToOrderRows(cells) {
  const rowsMap = new Map()

  Object.entries(cells || {}).forEach(([key, value]) => {
    if (key.endsWith('__checks')) {
      const customerName = key.replace('__checks', '')

      if (!rowsMap.has(customerName)) {
        rowsMap.set(customerName, createMigratedOrderRow(customerName))
      }

      rowsMap.get(customerName).checks = {
        A: Boolean(value?.A),
        B: Boolean(value?.B)
      }

      return
    }

    const [customerName, productName] = key.split('__')

    if (!customerName || !productName) return

    if (!rowsMap.has(customerName)) {
      rowsMap.set(customerName, createMigratedOrderRow(customerName))
    }

    rowsMap.get(customerName).cells[productName] = value
  })

  return Array.from(rowsMap.values())
}
