import { loadFirebaseState, saveFirebaseState } from './firebase.js'
import { setSyncStatus } from './sync/sync-status.js'

const DELIVERY_DAYS = [
  'Mandag',
  'Tirsdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lørdag',
  'Søndag'
]

const DEFAULT_PACKAGING_TYPE = 'kg'

export const state = {
  currentTab: 'orders',

  currentDate: new Date(),
  currentYear: null,
  currentWeek: null,

  selectedCell: null,

  customers: [],
  products: [],
  productPackagingTypes: {},

  deliveryDays: DELIVERY_DAYS,

  weeks: {}
}

let saveTimer = null

export async function initState() {
  try {
    setSyncStatus('connecting', 'Firebase: connecting...')

    const firebaseState = await loadFirebaseState()

    if (firebaseState) {
      applySavedState(firebaseState)
      setSyncStatus('saved', 'Firebase: loaded')
    } else {
      setSyncStatus('saved', 'Firebase: connected, no data')
    }
  } catch (error) {
    console.error('Firebase load failed:', error)
    setSyncStatus('error', 'Firebase: load error')
  }

  state.deliveryDays = DELIVERY_DAYS

  ensureProductPackagingTypes()
  updateCurrentYearWeek()
  ensureCurrentWeek()

  persistState()
}

export function persistState() {
  clearTimeout(saveTimer)

  setSyncStatus('saving', 'Firebase: saving...')

  saveTimer = setTimeout(() => {
    saveFirebaseState(prepareStateForSaving())
      .then(() => {
        console.log('Saved to Firebase')
        setSyncStatus('saved', 'Firebase: saved')
      })
      .catch(error => {
        console.error('Firebase save failed:', error)
        setSyncStatus('error', 'Firebase: save error')
      })
  }, 400)
}

export function getCurrentWeekId() {
  return `${state.currentYear}-W${String(state.currentWeek).padStart(2, '0')}`
}

export function ensureCurrentWeek() {
  const weekId = getCurrentWeekId()

  if (!state.weeks[weekId]) {
    state.weeks[weekId] = {
      rows: []
    }
  }

  if (!Array.isArray(state.weeks[weekId].rows)) {
    state.weeks[weekId].rows = migrateCellsToRows(state.weeks[weekId].cells || {})
    delete state.weeks[weekId].cells
  }
}

export function getCurrentRows() {
  ensureCurrentWeek()
  return state.weeks[getCurrentWeekId()].rows
}

export function goToPreviousWeek() {
  state.currentDate.setDate(state.currentDate.getDate() - 7)
  updateCurrentYearWeek()
  ensureCurrentWeek()
  persistState()
}

export function goToNextWeek() {
  state.currentDate.setDate(state.currentDate.getDate() + 7)
  updateCurrentYearWeek()
  ensureCurrentWeek()
  persistState()
}

export function addOrderRow() {
  const rows = getCurrentRows()

  const row = {
    id: createRowId(),
    customerName: '',
    deliveryDay: '',
    cells: {},
    checks: {
      A: false,
      B: false
    }
  }

  rows.push(row)
  persistState()

  return row
}

export function deleteOrderRow(rowId) {
  const rows = getCurrentRows()
  const index = rows.findIndex(row => row.id === rowId)

  if (index === -1) return

  rows.splice(index, 1)

  if (state.selectedCell?.rowId === rowId) {
    state.selectedCell = null
  }

  persistState()
}

export function updateOrderRowField(rowId, field, value) {
  const row = findOrderRow(rowId)
  if (!row) return

  row[field] = value
  persistState()
}

export function updateOrderCell(rowId, productName, value) {
  const row = findOrderRow(rowId)
  if (!row) return

  if (!row.cells) {
    row.cells = {}
  }

  if (!value || !value.items || value.items.length === 0) {
    delete row.cells[productName]
  } else {
    row.cells[productName] = value
  }

  persistState()
}

export function deleteOrderCell(rowId, productName) {
  const row = findOrderRow(rowId)
  if (!row || !row.cells) return

  delete row.cells[productName]
  persistState()
}

export function updateRowCheck(rowId, checkType, checked) {
  const row = findOrderRow(rowId)
  if (!row) return

  if (!row.checks) {
    row.checks = {
      A: false,
      B: false
    }
  }

  row.checks[checkType] = checked
  persistState()
}

export function findOrderRow(rowId) {
  const rows = getCurrentRows()
  return rows.find(row => row.id === rowId) || null
}

export function getOrderCell(rowId, productName) {
  const row = findOrderRow(rowId)

  if (!row || !row.cells) {
    return { items: [] }
  }

  return row.cells[productName] || { items: [] }
}

export function addCustomer(name) {
  const cleanName = normalizeName(name)
  if (!cleanName) return false

  if (state.customers.includes(cleanName)) {
    alert('Такий замовник вже існує')
    return false
  }

  state.customers.push(cleanName)
  persistState()

  return true
}

export function removeCustomer(name) {
  state.customers = state.customers.filter(customer => customer !== name)
  persistState()
}

export function addProduct(name) {
  const cleanName = normalizeName(name)
  if (!cleanName) return false

  if (state.products.includes(cleanName)) {
    alert('Такий продукт вже існує')
    return false
  }

  state.products.push(cleanName)

  if (!state.productPackagingTypes[cleanName]) {
    state.productPackagingTypes[cleanName] = [DEFAULT_PACKAGING_TYPE]
  }

  persistState()

  return true
}

export function removeProduct(name) {
  state.products = state.products.filter(product => product !== name)

  delete state.productPackagingTypes[name]

  Object.values(state.weeks).forEach(week => {
    if (!Array.isArray(week.rows)) return

    week.rows.forEach(row => {
      if (row.cells) {
        delete row.cells[name]
      }
    })
  })

  persistState()
}

export function getPackagingTypesForProduct(productName) {
  const types = state.productPackagingTypes[productName]

  if (!Array.isArray(types) || types.length === 0) {
    return [DEFAULT_PACKAGING_TYPE]
  }

  if (!types.includes(DEFAULT_PACKAGING_TYPE)) {
    return [DEFAULT_PACKAGING_TYPE, ...types]
  }

  return types
}

export function addProductPackagingType(productName, typeName) {
  const cleanProduct = normalizeName(productName)
  const cleanType = normalizeName(typeName)

  if (!cleanProduct || !cleanType) return false

  if (!state.products.includes(cleanProduct)) {
    alert('Спочатку додай продукт')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    state.productPackagingTypes[cleanProduct] = [DEFAULT_PACKAGING_TYPE]
  }

  if (state.productPackagingTypes[cleanProduct].includes(cleanType)) {
    alert('Такий тип упаковки вже існує для цього продукту')
    return false
  }

  state.productPackagingTypes[cleanProduct].push(cleanType)
  persistState()

  return true
}

export function removeProductPackagingType(productName, typeName) {
  const cleanProduct = normalizeName(productName)
  const cleanType = normalizeName(typeName)

  if (!cleanProduct || !cleanType) return false

  if (cleanType === DEFAULT_PACKAGING_TYPE) {
    alert('kg є стандартною мірою і не може бути видалено')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    return false
  }

  state.productPackagingTypes[cleanProduct] = state.productPackagingTypes[cleanProduct]
    .filter(type => type !== cleanType)

  Object.values(state.weeks).forEach(week => {
    if (!Array.isArray(week.rows)) return

    week.rows.forEach(row => {
      const cell = row.cells?.[cleanProduct]
      if (!cell || !Array.isArray(cell.items)) return

      cell.items = cell.items.filter(item => item.type !== cleanType)

      if (cell.items.length === 0) {
        delete row.cells[cleanProduct]
      }
    })
  })

  persistState()

  return true
}

function prepareStateForSaving() {
  return {
    currentDate: state.currentDate.toISOString(),
    customers: state.customers,
    products: state.products,
    productPackagingTypes: state.productPackagingTypes,
    weeks: state.weeks
  }
}

function applySavedState(savedState) {
  if (savedState.currentDate) {
    state.currentDate = new Date(savedState.currentDate)
  }

  if (Array.isArray(savedState.customers)) {
    state.customers = savedState.customers
  }

  if (Array.isArray(savedState.products)) {
    state.products = savedState.products
  }

  if (
    savedState.productPackagingTypes &&
    typeof savedState.productPackagingTypes === 'object'
  ) {
    state.productPackagingTypes = savedState.productPackagingTypes
  }

  state.deliveryDays = DELIVERY_DAYS

  if (savedState.weeks && typeof savedState.weeks === 'object') {
    state.weeks = savedState.weeks
  }

  migrateAllWeeksToRows()
  ensureProductPackagingTypes()
}

function ensureProductPackagingTypes() {
  state.products.forEach(product => {
    if (!Array.isArray(state.productPackagingTypes[product])) {
      state.productPackagingTypes[product] = [DEFAULT_PACKAGING_TYPE]
    }

    if (!state.productPackagingTypes[product].includes(DEFAULT_PACKAGING_TYPE)) {
      state.productPackagingTypes[product].unshift(DEFAULT_PACKAGING_TYPE)
    }
  })

  Object.keys(state.productPackagingTypes).forEach(productName => {
    if (!state.products.includes(productName)) {
      delete state.productPackagingTypes[productName]
    }
  })
}

function migrateAllWeeksToRows() {
  Object.values(state.weeks).forEach(week => {
    if (Array.isArray(week.rows)) return

    week.rows = migrateCellsToRows(week.cells || {})
    delete week.cells
  })
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

function normalizeName(value) {
  return String(value || '').trim()
}

function updateCurrentYearWeek() {
  const result = getISOWeek(state.currentDate)

  state.currentYear = result.year
  state.currentWeek = result.week
}

function getISOWeek(dateInput) {
  const date = new Date(Date.UTC(
    dateInput.getFullYear(),
    dateInput.getMonth(),
    dateInput.getDate()
  ))

  const dayNumber = date.getUTCDay() || 7

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber)

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))

  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)

  return {
    year: date.getUTCFullYear(),
    week
  }
}