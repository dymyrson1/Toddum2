import { state, getCurrentCells, getCurrentWeekId } from '../state.js'

export function getAnalyticsData() {
  const cells = getCurrentCells()

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

  state.customers.forEach(customer => {
    customerTotals[customer] = 0
  })

  Object.entries(cells).forEach(([key, value]) => {
    if (key.endsWith('__checks')) {
      if (value.A) checkedA++
      if (value.B) checkedB++
      return
    }

    if (!value.items || value.items.length === 0) return

    filledCells++

    const [customer, product] = key.split('__')

    value.items.forEach(item => {
      const qty = Number(item.qty) || 0

      totalItems++
      totalQty += qty

      if (productTotals[product] !== undefined) {
        productTotals[product] += qty
      }

      if (customerTotals[customer] !== undefined) {
        customerTotals[customer] += qty
      }
    })
  })

  return {
    weekId: getCurrentWeekId(),
    filledCells,
    totalItems,
    totalQty,
    checkedA,
    checkedB,
    productTotals,
    customerTotals
  }
}