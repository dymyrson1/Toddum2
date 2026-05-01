#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split analytics-data.js into smaller data utility modules"
echo ""

FILES=(
  "js/analytics/analytics-data.js"
  "js/analytics/analytics-weight-utils.js"
  "js/analytics/analytics-stats-utils.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-analytics-data.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/analytics

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/analytics/analytics-data.js <<'JS'
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
  const orderRows = rows.filter(row => hasOrderContent(row, products))

  const customerStats = new Map()
  const productStats = new Map()
  const deliveryDayStats = new Map()
  const problems = createAnalyticsProblems()

  let totalWeightKg = 0
  let orderLineCount = 0
  let packedCount = 0
  let deliveredCount = 0

  orderRows.forEach(row => {
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
JS

cat > js/analytics/analytics-weight-utils.js <<'JS'
export function hasOrderContent(row, products = []) {
  return products.some(productName => {
    const cell = row.cells?.[productName]

    return Array.isArray(cell?.items) && cell.items.length > 0
  })
}

export function getRowWeight(row, products = []) {
  let total = 0

  products.forEach(productName => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    items.forEach(item => {
      const qty = Number(item.qty) || 0
      const weightKg = Number(item.weightKg) || getFallbackWeight(item)

      total += qty * weightKg
    })
  })

  return total
}

export function getRowLineCount(row, products = []) {
  let count = 0

  products.forEach(productName => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    count += items.filter(item => Number(item.qty) > 0).length
  })

  return count
}

export function getFallbackWeight(item) {
  const label = String(item.label || item.packageName || '').toLowerCase()

  if (label.includes('10g')) return 0.01
  if (label.includes('125g')) return 0.125
  if (label.includes('250g')) return 0.25
  if (label.includes('500g')) return 0.5
  if (label.includes('3kg')) return 3
  if (label.includes('5kg')) return 5
  if (label.includes('6kg')) return 6
  if (label.includes('8kg')) return 8
  if (label === 'l') return 1
  if (label === 'kg') return 1

  return 1
}
JS

cat > js/analytics/analytics-stats-utils.js <<'JS'
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
  products.forEach(productName => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    items.forEach(item => {
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
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
