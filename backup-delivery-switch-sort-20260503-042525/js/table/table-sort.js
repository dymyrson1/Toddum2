let tableSort = {
  key: 'default',
  direction: 'default'
}

const SORT_CYCLE = ['default', 'asc', 'desc']

export function getTableSort() {
  return tableSort
}

export function toggleTableSort(key) {
  if (!key) return

  if (tableSort.key !== key) {
    tableSort = { key, direction: 'asc' }
    return
  }

  const currentIndex = SORT_CYCLE.indexOf(tableSort.direction)
  const nextDirection = SORT_CYCLE[(currentIndex + 1) % SORT_CYCLE.length]

  tableSort = {
    key: nextDirection === 'default' ? 'default' : key,
    direction: nextDirection
  }
}

export function sortRowsForDisplay(rows) {
  if (!Array.isArray(rows)) return []
  if (tableSort.key === 'default' || tableSort.direction === 'default') return rows

  return [...rows].sort((a, b) => {
    const result = compareRows(a, b, tableSort.key)
    return tableSort.direction === 'asc' ? result : -result
  })
}

function compareRows(a, b, key) {
  if (key === 'customer') return compareText(a.customerName, b.customerName)
  if (key === 'packed') return compareBoolean(a.checks?.A, b.checks?.A)
  if (key === 'delivered') return compareBoolean(a.checks?.B, b.checks?.B)
  if (key === 'deliveryDay') return compareDeliveryDay(a.deliveryDay, b.deliveryDay)
  if (key === 'merknad') return compareText(a.merknad, b.merknad)

  if (key.startsWith('product:')) {
    const productName = key.slice('product:'.length)
    return compareProductCell(a.cells?.[productName], b.cells?.[productName])
  }

  return 0
}

function compareProductCell(a, b) {
  const qtyA = getCellTotalQty(a)
  const qtyB = getCellTotalQty(b)

  if (qtyA !== qtyB) return qtyA - qtyB

  return compareText(getCellText(a), getCellText(b))
}

function getCellTotalQty(cell) {
  if (!cell || !Array.isArray(cell.items)) return 0

  return cell.items.reduce((sum, item) => {
    const qty = Number(item.qty)
    return sum + (Number.isFinite(qty) ? qty : 0)
  }, 0)
}

function getCellText(cell) {
  if (!cell || !Array.isArray(cell.items)) return ''

  return cell.items
    .map((item) => `${item.qty || ''} ${item.label || item.packageName || ''}`)
    .join(' ')
}

function compareText(a, b) {
  const valueA = String(a || '').trim()
  const valueB = String(b || '').trim()

  if (!valueA && !valueB) return 0
  if (!valueA) return 1
  if (!valueB) return -1

  return valueA.localeCompare(valueB, 'nb', {
    sensitivity: 'base',
    numeric: true
  })
}

function compareBoolean(a, b) {
  return Number(Boolean(a)) - Number(Boolean(b))
}

function compareDeliveryDay(a, b) {
  const days = {
    mandag: 1,
    tirsdag: 2,
    onsdag: 3,
    torsdag: 4,
    fredag: 5,
    lordag: 6,
    lørdag: 6,
    sondag: 7,
    søndag: 7
  }

  const valueA = normalizeDay(a)
  const valueB = normalizeDay(b)

  const indexA = days[valueA] || 99
  const indexB = days[valueB] || 99

  if (indexA !== indexB) return indexA - indexB

  return compareText(valueA, valueB)
}

function normalizeDay(value) {
  return String(value || '').trim().toLowerCase()
}

export function getSortArrow(key) {
  if (tableSort.key !== key || tableSort.direction === 'default') return '↕'
  return tableSort.direction === 'asc' ? '↑' : '↓'
}
