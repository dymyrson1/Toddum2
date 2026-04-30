import { state, getCurrentRows, getCurrentWeekId } from '../state.js'

export function getAnalyticsData() {
  const rows = getCurrentRows()

  const productTotals = {}
  const customerTotals = {}

  let filledCells = 0
  let totalItems = 0
  let totalQty = 0
  let checkedA = 0
  let checkedB = 0

  state.products.forEach(product => {
    productTotals[product] = 0
  })

  rows.forEach(row => {
    const customerName = row.customerName || 'Без замовника'

    if (!customerTotals[customerName]) {
      customerTotals[customerName] = 0
    }

    if (row.checks?.A) checkedA++
    if (row.checks?.B) checkedB++

    Object.entries(row.cells || {}).forEach(([product, cell]) => {
      if (!cell.items || cell.items.length === 0) return

      filledCells++

      cell.items.forEach(item => {
        const qty = Number(item.qty) || 0

        totalItems++
        totalQty += qty

        if (productTotals[product] === undefined) {
          productTotals[product] = 0
        }

        productTotals[product] += qty
        customerTotals[customerName] += qty
      })
    })
  })

  return {
    weekId: getCurrentWeekId(),
    orderRows: rows.length,
    filledCells,
    totalItems,
    totalQty,
    checkedA,
    checkedB,
    productTotals,
    customerTotals
  }
}