import {
  addCustomerStat,
  addDeliveryDayStat,
  addProductStats,
  collectRowProblems,
  createAnalyticsProblems,
  sortByWeight,
  sortDeliveryDays
} from './analytics-stats-utils.js'

import {
  getRowLineCount,
  getRowWeight,
  hasOrderContent
} from './analytics-weight-utils.js'

export { hasOrderContent } from './analytics-weight-utils.js'

export function buildAnalyticsData({
  rows = [],
  products = [],
  deliveryDays = [],
  weekLabel = ''
}) {
  const orderRows = rows.filter((row) => hasOrderContent(row, products))

  const customerStats = new Map()
  const productStats = new Map()
  const deliveryDayStats = new Map()
  const problems = createAnalyticsProblems()

  let totalWeightKg = 0
  let orderLineCount = 0
  let packedCount = 0
  let deliveredCount = 0

  orderRows.forEach((row) => {
    const customerName = row.customerName || 'Uten kunde'
    const deliveryDay = row.deliveryDay || 'Uten leveringsdag'
    const rowWeightKg = getRowWeight(row, products)
    const rowLineCount = getRowLineCount(row, products)

    totalWeightKg += rowWeightKg
    orderLineCount += rowLineCount

    if (row.checks?.A) packedCount += 1
    if (row.checks?.B) deliveredCount += 1

    addCustomerStat(customerStats, customerName, rowWeightKg, rowLineCount)
    addDeliveryDayStat(deliveryDayStats, deliveryDay, rowWeightKg, rowLineCount)
    addProductStats(productStats, row, products)
    collectRowProblems(problems, row)
  })

  return {
    weekLabel,
    totalRows: rows.length,
    orderRowsCount: orderRows.length,
    orderLineCount,
    totalWeightKg,
    packedCount,
    deliveredCount,
    notPackedCount: orderRows.length - packedCount,
    notDeliveredCount: orderRows.length - deliveredCount,
    customerList: sortByWeight(customerStats),
    productList: sortByWeight(productStats),
    deliveryDayList: sortDeliveryDays([...deliveryDayStats.values()], deliveryDays),
    problems
  }
}

export function getPercent(current, total) {
  if (!total) return 0

  return Math.round((current / total) * 100)
}
