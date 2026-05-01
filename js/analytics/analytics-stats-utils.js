import { getFallbackWeight } from './analytics-weight-utils.js'

export function createAnalyticsProblems() {
  return {
    missingCustomer: [],
    missingDeliveryDay: [],
    notPacked: [],
    notDelivered: [],
    packedNotDelivered: []
  }
}

export function collectRowProblems(problems, row) {
  if (!row.customerName) {
    problems.missingCustomer.push(row)
  }

  if (!row.deliveryDay) {
    problems.missingDeliveryDay.push(row)
  }

  if (!row.checks?.A) {
    problems.notPacked.push(row)
  }

  if (!row.checks?.B) {
    problems.notDelivered.push(row)
  }

  if (row.checks?.A && !row.checks?.B) {
    problems.packedNotDelivered.push(row)
  }
}

export function addCustomerStat(map, customerName, weightKg, lineCount) {
  if (!map.has(customerName)) {
    map.set(customerName, {
      customerName,
      totalWeightKg: 0,
      orderLineCount: 0
    })
  }

  const item = map.get(customerName)

  item.totalWeightKg += weightKg
  item.orderLineCount += lineCount
}

export function addDeliveryDayStat(map, deliveryDay, weightKg, lineCount) {
  if (!map.has(deliveryDay)) {
    map.set(deliveryDay, {
      deliveryDay,
      customerCount: 0,
      orderLineCount: 0,
      totalWeightKg: 0
    })
  }

  const item = map.get(deliveryDay)

  item.customerCount += 1
  item.orderLineCount += lineCount
  item.totalWeightKg += weightKg
}

export function addProductStats(map, row, products = []) {
  products.forEach((productName) => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    items.forEach((item) => {
      const qty = Number(item.qty) || 0
      const weightKg = Number(item.weightKg) || getFallbackWeight(item)

      if (qty <= 0) return

      if (!map.has(productName)) {
        map.set(productName, {
          productName,
          totalWeightKg: 0,
          orderLineCount: 0
        })
      }

      const product = map.get(productName)

      product.totalWeightKg += qty * weightKg
      product.orderLineCount += 1
    })
  })
}

export function sortByWeight(map) {
  return [...map.values()].sort((a, b) => b.totalWeightKg - a.totalWeightKg)
}

export function sortDeliveryDays(days, deliveryDays = []) {
  const order = [...deliveryDays, 'Uten leveringsdag']

  return days.sort((a, b) => {
    const indexA = order.indexOf(a.deliveryDay)
    const indexB = order.indexOf(b.deliveryDay)

    const safeA = indexA === -1 ? 999 : indexA
    const safeB = indexB === -1 ? 999 : indexB

    return safeA - safeB
  })
}
