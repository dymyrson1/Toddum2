import { loadFirebaseState, saveFirebaseState } from './firebase.js'

const DEFAULT_PACKAGING_TYPE = 'kg'

export async function migrateFirebaseStructure() {
  const confirmed = confirm(
    'УВАГА: Це оновить структуру Firebase під нову модель упаковок по продуктах. Дані замовлень мають зберегтись. Продовжити?'
  )

  if (!confirmed) {
    console.log('Firebase migration cancelled')
    return
  }

  try {
    console.log('Starting Firebase migration...')

    const currentData = await loadFirebaseState()

    if (!currentData) {
      console.warn('Firebase document is empty. Creating clean structure.')

      const emptyState = {
        currentDate: new Date().toISOString(),
        customers: [],
        products: [],
        productPackagingTypes: {},
        weeks: {}
      }

      await saveFirebaseState(emptyState)

      console.log('Empty Firebase structure created:', emptyState)
      alert('Firebase була порожня. Створено чисту структуру.')
      return
    }

    const migratedData = migrateData(currentData)

    console.log('Old Firebase data:', currentData)
    console.log('Migrated Firebase data:', migratedData)

    await saveFirebaseState(migratedData)

    console.log('Firebase migration completed')
    alert('Міграцію Firebase завершено. Онови сторінку.')
  } catch (error) {
    console.error('Firebase migration failed:', error)
    alert('Помилка міграції Firebase. Дивись Console.')
  }
}

export async function checkFirebaseStructure() {
  try {
    const data = await loadFirebaseState()

    console.log('Current Firebase data:', data)

    return data
  } catch (error) {
    console.error('Firebase check failed:', error)
    return null
  }
}

function migrateData(data) {
  const customers = Array.isArray(data.customers)
    ? data.customers
    : []

  const products = Array.isArray(data.products)
    ? data.products
    : []

  const productPackagingTypes = buildProductPackagingTypes(data, products)

  const weeks = migrateWeeks(data.weeks || {})

  return {
    currentDate: data.currentDate || new Date().toISOString(),
    customers,
    products,
    productPackagingTypes,
    weeks
  }
}

function buildProductPackagingTypes(data, products) {
  const result = {}

  const existingProductPackagingTypes =
    data.productPackagingTypes &&
    typeof data.productPackagingTypes === 'object'
      ? data.productPackagingTypes
      : {}

  products.forEach(product => {
    const existingTypes = Array.isArray(existingProductPackagingTypes[product])
      ? existingProductPackagingTypes[product]
      : []

    result[product] = normalizePackagingTypes(existingTypes)
  })

  return result
}

function normalizePackagingTypes(types) {
  const cleanTypes = types
    .map(type => String(type || '').trim())
    .filter(Boolean)

  const uniqueTypes = [...new Set(cleanTypes)]

  if (!uniqueTypes.includes(DEFAULT_PACKAGING_TYPE)) {
    uniqueTypes.unshift(DEFAULT_PACKAGING_TYPE)
  }

  return uniqueTypes
}

function migrateWeeks(weeks) {
  const result = {}

  Object.entries(weeks).forEach(([weekId, weekData]) => {
    if (Array.isArray(weekData.rows)) {
      result[weekId] = {
        rows: normalizeRows(weekData.rows)
      }

      return
    }

    if (weekData.cells && typeof weekData.cells === 'object') {
      result[weekId] = {
        rows: migrateCellsToRows(weekData.cells)
      }

      return
    }

    result[weekId] = {
      rows: []
    }
  })

  return result
}

function normalizeRows(rows) {
  return rows.map(row => ({
    id: row.id || createRowId(),
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    cells: row.cells && typeof row.cells === 'object' ? row.cells : {},
    checks: {
      A: Boolean(row.checks?.A),
      B: Boolean(row.checks?.B)
    }
  }))
}

function migrateCellsToRows(cells) {
  const rowsMap = new Map()

  Object.entries(cells).forEach(([key, value]) => {
    if (key.endsWith('__checks')) {
      const customerName = key.replace('__checks', '')

      if (!rowsMap.has(customerName)) {
        rowsMap.set(customerName, createMigratedRow(customerName))
      }

      rowsMap.get(customerName).checks = {
        A: Boolean(value.A),
        B: Boolean(value.B)
      }

      return
    }

    const [customerName, productName] = key.split('__')

    if (!customerName || !productName) return

    if (!rowsMap.has(customerName)) {
      rowsMap.set(customerName, createMigratedRow(customerName))
    }

    rowsMap.get(customerName).cells[productName] = value
  })

  return Array.from(rowsMap.values())
}

function createMigratedRow(customerName) {
  return {
    id: createRowId(),
    customerName,
    deliveryDay: '',
    cells: {},
    checks: {
      A: false,
      B: false
    }
  }
}

function createRowId() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}