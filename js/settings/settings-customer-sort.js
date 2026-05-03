let settingsCustomerSort = {
  key: 'default',
  direction: 'default'
}

const SORT_CYCLE = ['default', 'asc', 'desc']

export function toggleSettingsCustomerSort(key) {
  if (settingsCustomerSort.key !== key) {
    settingsCustomerSort = { key, direction: 'asc' }
    return
  }

  const currentIndex = SORT_CYCLE.indexOf(settingsCustomerSort.direction)
  const nextDirection = SORT_CYCLE[(currentIndex + 1) % SORT_CYCLE.length]

  settingsCustomerSort = {
    key: nextDirection === 'default' ? 'default' : key,
    direction: nextDirection
  }
}

export function sortSettingsCustomers(customers = []) {
  const defaultSorted = [...customers].sort((a, b) => {
    return compareNumber(a.deliveryOrder, b.deliveryOrder) || compareText(a.name, b.name)
  })

  if (
    settingsCustomerSort.key === 'default' ||
    settingsCustomerSort.direction === 'default'
  ) {
    return defaultSorted
  }

  return defaultSorted.sort((a, b) => {
    const result = compareCustomers(a, b, settingsCustomerSort.key)
    return settingsCustomerSort.direction === 'asc' ? result : -result
  })
}

function compareCustomers(a, b, key) {
  if (key === 'name') return compareText(a.name, b.name)
  if (key === 'contactPerson') return compareText(a.contactPerson, b.contactPerson)
  if (key === 'phone') return compareText(a.phone, b.phone)
  if (key === 'address') return compareText(a.address, b.address)
  if (key === 'deliveryOrder') return compareNumber(a.deliveryOrder, b.deliveryOrder)

  return 0
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

function compareNumber(a, b) {
  const valueA = Number(a)
  const valueB = Number(b)

  const safeA = Number.isFinite(valueA) ? valueA : 999999
  const safeB = Number.isFinite(valueB) ? valueB : 999999

  return safeA - safeB
}

export function getSettingsCustomerSortLabel(key, label) {
  if (
    settingsCustomerSort.key !== key ||
    settingsCustomerSort.direction === 'default'
  ) {
    return `${label} ↕`
  }

  return settingsCustomerSort.direction === 'asc'
    ? `${label} ↑`
    : `${label} ↓`
}
