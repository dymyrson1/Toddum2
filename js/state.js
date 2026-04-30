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

const DEFAULT_PACKAGING_OPTION = {
  id: 'kg__1',
  packageName: 'kg',
  weightKg: 1,
  label: 'kg',
  isDefault: true
}

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
  normalizeAllWeekData()
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

  state.weeks[weekId].rows = normalizeRows(state.weeks[weekId].rows)
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

  const cleanItems = normalizeCellItems(productName, value?.items || [])

  if (cleanItems.length === 0) {
    delete row.cells[productName]
  } else {
    row.cells[productName] = {
      items: cleanItems
    }
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

  const cell = row.cells[productName] || { items: [] }

  return {
    items: normalizeCellItems(productName, cell.items || [])
  }
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
    state.productPackagingTypes[cleanName] = [createDefaultPackagingOption()]
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

export function getPackagingOptionsForProduct(productName) {
  const options = state.productPackagingTypes[productName]

  return normalizePackagingOptions(options || [createDefaultPackagingOption()])
}

export function getPackagingTypesForProduct(productName) {
  return getPackagingOptionsForProduct(productName).map(option => option.label)
}

export function addProductPackagingOption(productName, packageName, weightKgInput) {
  const cleanProduct = normalizeName(productName)
  const cleanPackageName = normalizeName(packageName)

  if (!cleanProduct || !cleanPackageName) return false

  if (!state.products.includes(cleanProduct)) {
    alert('Спочатку додай продукт')
    return false
  }

  const option = createPackagingOption(cleanPackageName, weightKgInput)

  if (!option) {
    alert('Вкажи коректну назву упаковки і вагу')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    state.productPackagingTypes[cleanProduct] = [createDefaultPackagingOption()]
  }

  const exists = state.productPackagingTypes[cleanProduct]
    .some(item => parsePackagingOption(item)?.id === option.id)

  if (exists) {
    alert('Такий варіант вже існує для цього продукту')
    return false
  }

  state.productPackagingTypes[cleanProduct].push(option)
  state.productPackagingTypes[cleanProduct] = normalizePackagingOptions(
    state.productPackagingTypes[cleanProduct]
  )

  persistState()
  return true
}

export function removeProductPackagingOption(productName, optionId) {
  const cleanProduct = normalizeName(productName)
  const cleanOptionId = normalizeName(optionId)

  if (!cleanProduct || !cleanOptionId) return false

  const optionToRemove = getPackagingOptionsForProduct(cleanProduct)
    .find(option => option.id === cleanOptionId)

  if (optionToRemove?.isDefault) {
    alert('kg є стандартною мірою і не може бути видалено')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    return false
  }

  state.productPackagingTypes[cleanProduct] = state.productPackagingTypes[cleanProduct]
    .map(option => parsePackagingOption(option))
    .filter(Boolean)
    .filter(option => option.id !== cleanOptionId)

  Object.values(state.weeks).forEach(week => {
    if (!Array.isArray(week.rows)) return

    week.rows.forEach(row => {
      const cell = row.cells?.[cleanProduct]
      if (!cell || !Array.isArray(cell.items)) return

      cell.items = cell.items.filter(item => item.packageId !== cleanOptionId)

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
}

function ensureProductPackagingTypes() {
  state.products.forEach(product => {
    state.productPackagingTypes[product] = normalizePackagingOptions(
      state.productPackagingTypes[product] || [createDefaultPackagingOption()]
    )
  })

  Object.keys(state.productPackagingTypes).forEach(productName => {
    if (!state.products.includes(productName)) {
      delete state.productPackagingTypes[productName]
    }
  })
}

function normalizeAllWeekData() {
  Object.values(state.weeks).forEach(week => {
    if (!Array.isArray(week.rows)) {
      week.rows = []
    }

    week.rows = normalizeRows(week.rows)
  })
}

function normalizeRows(rows) {
  return rows.map(row => ({
    id: row.id || createRowId(),
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    cells: normalizeRowCells(row.cells || {}),
    checks: {
      A: Boolean(row.checks?.A),
      B: Boolean(row.checks?.B)
    }
  }))
}

function normalizeRowCells(cells) {
  const result = {}

  Object.entries(cells || {}).forEach(([productName, cell]) => {
    const items = normalizeCellItems(productName, cell?.items || [])

    if (items.length > 0) {
      result[productName] = { items }
    }
  })

  return result
}

function normalizeCellItems(productName, items) {
  const options = getPackagingOptionsForProduct(productName)
  const used = new Set()

  const cleanItems = items
    .map(item => normalizeCellItem(item, options))
    .filter(Boolean)
    .filter(item => {
      if (used.has(item.packageId)) return false
      used.add(item.packageId)
      return true
    })
    .sort((a, b) => a.weightKg - b.weightKg || a.label.localeCompare(b.label))

  return cleanItems
}

function normalizeCellItem(item, options) {
  const qty = Number(item?.qty)

  if (!Number.isFinite(qty) || qty <= 0) {
    return null
  }

  const rawId = normalizeName(item?.packageId)
  const rawType = normalizeName(item?.type || item?.packageName || item?.label)

  let option = null

  if (rawId) {
    option = options.find(entry => entry.id === rawId) || null
  }

  if (!option && rawType) {
    const normalizedRawType = normalizeLooseText(rawType)

    option = options.find(entry =>
      normalizeLooseText(entry.id) === normalizedRawType ||
      normalizeLooseText(entry.packageName) === normalizedRawType ||
      normalizeLooseText(entry.label) === normalizedRawType
    ) || null
  }

  if (!option && rawType) {
    option = parsePackagingOption(rawType)
  }

  if (!option) {
    return null
  }

  return {
    packageId: option.id,
    packageName: option.packageName,
    weightKg: option.weightKg,
    label: option.label,
    qty
  }
}

function normalizePackagingOptions(options) {
  const list = Array.isArray(options) ? options : []
  const result = [createDefaultPackagingOption()]

  list.forEach(entry => {
    const option = parsePackagingOption(entry)

    if (!option) return
    if (option.isDefault) return

    const exists = result.some(item => item.id === option.id)
    if (!exists) {
      result.push(option)
    }
  })

  return result.sort((a, b) => {
    return a.weightKg - b.weightKg || a.label.localeCompare(b.label)
  })
}

function parsePackagingOption(value) {
  if (!value) return null

  if (typeof value === 'string') {
    return parsePackagingString(value)
  }

  if (typeof value === 'object') {
    const packageName = normalizeName(value.packageName || value.name || '')
    const weightKg = toNumber(value.weightKg ?? value.weight)

    if (!packageName) return null
    if (packageName.toLowerCase() === 'kg') return createDefaultPackagingOption()

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return null
    }

    return createPackagingOption(packageName, weightKg)
  }

  return null
}

function parsePackagingString(text) {
  const cleanText = normalizeName(text)
  if (!cleanText) return null

  if (cleanText.toLowerCase() === 'kg') {
    return createDefaultPackagingOption()
  }

  const gramMatch = cleanText.match(/^([\d.,]+)\s*g$/i)
  if (gramMatch) {
    const grams = Number(String(gramMatch[1]).replace(',', '.'))
    if (!Number.isFinite(grams) || grams <= 0) return null

    return createPackagingOption(cleanText, grams / 1000)
  }

  const kgOnlyMatch = cleanText.match(/^([\d.,]+)\s*kg$/i)
  if (kgOnlyMatch) {
    const kg = Number(String(kgOnlyMatch[1]).replace(',', '.'))
    if (!Number.isFinite(kg) || kg <= 0) return null

    return createPackagingOption(cleanText, kg)
  }

  const namedKgMatch = cleanText.match(/^(.*?)\s*-?\s*([\d.,]+)\s*kg$/i)
  if (namedKgMatch) {
    const packageName = normalizeName(namedKgMatch[1])
    const kg = Number(String(namedKgMatch[2]).replace(',', '.'))

    if (packageName && Number.isFinite(kg) && kg > 0) {
      return createPackagingOption(packageName, kg)
    }
  }

  return null
}

function createDefaultPackagingOption() {
  return { ...DEFAULT_PACKAGING_OPTION }
}

function createPackagingOption(packageName, weightKgInput) {
  const cleanPackageName = normalizeName(packageName)
  const weightKg = toNumber(weightKgInput)

  if (!cleanPackageName) return null

  if (cleanPackageName.toLowerCase() === 'kg') {
    return createDefaultPackagingOption()
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return null
  }

  return {
    id: `${slugify(cleanPackageName)}__${normalizeWeightKey(weightKg)}`,
    packageName: cleanPackageName,
    weightKg,
    label: buildPackagingLabel(cleanPackageName, weightKg),
    isDefault: false
  }
}

function buildPackagingLabel(packageName, weightKg) {
  if (packageName.toLowerCase() === 'kg') {
    return 'kg'
  }

  const weightLabel = formatWeight(weightKg)

  if (normalizeLooseText(packageName) === normalizeLooseText(weightLabel)) {
    return packageName
  }

  return `${packageName} - ${weightLabel}`
}

function formatWeight(weightKg) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return ''
  }

  const grams = Math.round(weightKg * 1000)

  if (grams < 1000) {
    return `${grams} g`
  }

  if (grams % 1000 === 0) {
    return `${grams / 1000} kg`
  }

  return `${trimZeros((grams / 1000).toFixed(2))} kg`
}

function normalizeWeightKey(weightKg) {
  return trimZeros(Number(weightKg).toFixed(3))
}

function trimZeros(value) {
  return String(value).replace(/\.?0+$/, '')
}

function toNumber(value) {
  if (typeof value === 'number') return value
  return Number(String(value || '').replace(',', '.'))
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яіїєåøæ_-]/gi, '')
}

function normalizeLooseText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('-', '')
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