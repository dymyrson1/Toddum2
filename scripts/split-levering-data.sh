#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split levering-data.js into smaller data utility modules"
echo ""

FILES=(
  "js/levering/levering-data.js"
  "js/levering/levering-customer-utils.js"
  "js/levering/levering-item-utils.js"
  "js/levering/levering-group-utils.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-levering-data.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/levering

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/levering/levering-data.js <<'JS'
import {
  findCustomerForRow,
  getDeliveryOrder,
  sortDeliveriesByCustomerNumber
} from './levering-customer-utils.js'

import {
  getDeliveryDayOrder,
  groupDeliveriesByDay
} from './levering-group-utils.js'

import {
  getDeliveryItems,
  hasOrderContent
} from './levering-item-utils.js'

export {
  findCustomerForRow,
  getDeliveryOrder,
  sortDeliveriesByCustomerNumber
} from './levering-customer-utils.js'

export {
  getDeliveryDayOrder,
  groupDeliveriesByDay
} from './levering-group-utils.js'

export {
  formatDeliveryItem,
  getDeliveryItems,
  hasOrderContent
} from './levering-item-utils.js'

export function buildLeveringData({
  rows = [],
  customers = [],
  deliveryDays = []
}) {
  const deliveries = rows
    .filter(hasOrderContent)
    .map(row => {
      const customer = findCustomerForRow(customers, row.customerName)
      const deliveryDay = row.deliveryDay || 'Uten leveringsdag'

      return {
        rowId: row.id,
        deliveryOrder: getDeliveryOrder(customer),
        customerName: row.customerName || 'Uten kunde',
        address: customer?.address || '',
        phone: customer?.phone || '',
        contactPerson: customer?.contactPerson || '',
        deliveryDay,
        items: getDeliveryItems(row),
        packed: Boolean(row.checks?.A),
        delivered: Boolean(row.checks?.B)
      }
    })
    .sort(sortDeliveriesByCustomerNumber)

  return {
    deliveries,
    groups: groupDeliveriesByDay(deliveries, deliveryDays)
  }
}

export function getVisibleDeliveryGroups(groups, selectedDeliveryDay) {
  if (selectedDeliveryDay === 'Alle') {
    return groups
  }

  return groups.filter(group => group.day === selectedDeliveryDay)
}

export function getDeliveryFilterItems(data, deliveryDays, selectedDeliveryDay) {
  const availableDays = new Set(data.groups.map(group => group.day))

  const filterItems = [
    {
      label: 'Alle',
      value: 'Alle',
      count: data.deliveries.length
    },
    ...getDeliveryDayOrder(deliveryDays)
      .filter(day => availableDays.has(day))
      .map(day => ({
        label: day,
        value: day,
        count: data.groups.find(group => group.day === day)?.deliveries.length || 0
      }))
  ]

  const safeSelectedDeliveryDay = filterItems.some(item => {
    return item.value === selectedDeliveryDay
  })
    ? selectedDeliveryDay
    : 'Alle'

  return {
    filterItems,
    selectedDeliveryDay: safeSelectedDeliveryDay
  }
}
JS

cat > js/levering/levering-customer-utils.js <<'JS'
export function findCustomerForRow(customers, customerName) {
  const cleanRowName = normalizeText(customerName)

  if (!cleanRowName) return null

  return (
    customers.find(customer => {
      return normalizeText(getCustomerNameValue(customer)) === cleanRowName
    }) || null
  )
}

export function getDeliveryOrder(customer) {
  const order = Number(customer?.deliveryOrder)

  if (!Number.isFinite(order) || order <= 0) {
    return null
  }

  return order
}

export function sortDeliveriesByCustomerNumber(a, b) {
  const orderA = a.deliveryOrder
  const orderB = b.deliveryOrder

  if (orderA !== null && orderB !== null && orderA !== orderB) {
    return orderA - orderB
  }

  if (orderA !== null && orderB === null) {
    return -1
  }

  if (orderA === null && orderB !== null) {
    return 1
  }

  return a.customerName.localeCompare(b.customerName)
}

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function getCustomerNameValue(customer) {
  if (typeof customer === 'string') return customer

  return customer?.name || ''
}
JS

cat > js/levering/levering-item-utils.js <<'JS'
export function hasOrderContent(row) {
  return Object.values(row.cells || {}).some(cell => {
    return Array.isArray(cell.items) && cell.items.length > 0
  })
}

export function getDeliveryItems(row) {
  return Object.entries(row.cells || {})
    .map(([productName, cell]) => {
      const items = Array.isArray(cell.items) ? cell.items : []
      const itemText = items.map(formatDeliveryItem).filter(Boolean).join(', ')

      if (!itemText) return null

      return {
        productName,
        itemText
      }
    })
    .filter(Boolean)
}

export function formatDeliveryItem(item) {
  const qty = Number(item.qty) || 0
  const label = item.label || item.packageName || item.type || '—'
  const packageName = String(item.packageName || '').toLowerCase()
  const labelLower = String(label).toLowerCase()

  if (!qty) return ''

  if (packageName === 'kg' || labelLower === 'kg') {
    return `${formatNumber(qty)}kg`
  }

  if (
    packageName === 'l' ||
    packageName === 'liter' ||
    packageName === 'literer' ||
    labelLower === 'l' ||
    labelLower === 'liter' ||
    labelLower === 'literer'
  ) {
    return `${formatNumber(qty)}l`
  }

  if (packageName.includes('spann') || labelLower.includes('spann')) {
    return `${formatNumber(qty)} spann`
  }

  return `${formatNumber(qty)}x${label}`
}

function formatNumber(value) {
  return Number(value).toLocaleString('nb-NO', {
    maximumFractionDigits: 2
  })
}
JS

cat > js/levering/levering-group-utils.js <<'JS'
import { sortDeliveriesByCustomerNumber } from './levering-customer-utils.js'

export function groupDeliveriesByDay(deliveries, deliveryDays) {
  const groups = new Map()

  deliveries.forEach(delivery => {
    if (!groups.has(delivery.deliveryDay)) {
      groups.set(delivery.deliveryDay, [])
    }

    groups.get(delivery.deliveryDay).push(delivery)
  })

  return getDeliveryDayOrder(deliveryDays)
    .filter(day => groups.has(day))
    .map(day => ({
      day,
      deliveries: groups.get(day).sort(sortDeliveriesByCustomerNumber)
    }))
}

export function getDeliveryDayOrder(deliveryDays = []) {
  return [...deliveryDays, 'Uten leveringsdag']
}
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
