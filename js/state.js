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

const MAX_LOGS = 300

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

  weeks: {},
  logs: []
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

  state.currentDate = new Date()
  state.deliveryDays = DELIVERY_DAYS

  state.customers = normalizeCustomers(state.customers)

  ensureProductPackagingTypes()
  normalizeAllWeekData()
  ensureCustomersFromOrderRows()
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

export function getCurrentWeekLabel() {
  return `Uke ${state.currentWeek}`
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
  merknad: '',
  cells: {},
  checks: {
    A: false,
    B: false
  }
}

  rows.push(row)

  addLog('add_row', {
    actionLabel: 'La til rad'
  })

  persistState()
  return row
}

export function deleteOrderRow(rowId) {
  const rows = getCurrentRows()
  const index = rows.findIndex(row => row.id === rowId)

  if (index === -1) return

  const row = rows[index]

  rows.splice(index, 1)

  if (state.selectedCell?.rowId === rowId) {
    state.selectedCell = null
  }

  addLog('delete_row', {
    actionLabel: 'Slettet rad',
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || ''
  })

  persistState()
}

export function updateOrderRowField(rowId, field, value) {
  const row = findOrderRow(rowId)
  if (!row) return

  const oldValue = row[field] || ''
  const newValue = value || ''

  if (oldValue === newValue) return

  row[field] = newValue

  if (field === 'customerName' && newValue) {
    ensureCustomerExists(newValue)
  }

  addLog('update_row_field', {
    actionLabel: field === 'customerName' ? 'Endret kunde' : 'Endret leveringsdag',
    customerName: field === 'customerName' ? newValue : row.customerName || '',
    deliveryDay: field === 'deliveryDay' ? newValue : row.deliveryDay || '',
    oldValue,
    newValue
  })

  persistState()
}

function ensureCustomersFromOrderRows() {
  Object.values(state.weeks).forEach(week => {
    if (!Array.isArray(week.rows)) return

    week.rows.forEach(row => {
      if (row.customerName) {
        ensureCustomerExists(row.customerName)
      }
    })
  })
}

export function updateOrderCell(rowId, productName, value) {
  const row = findOrderRow(rowId)
  if (!row) return

  if (!row.cells) {
    row.cells = {}
  }

  const oldItems = row.cells[productName]?.items || []
  const oldValue = formatCellForLog(oldItems)

  const cleanItems = normalizeCellItems(productName, value?.items || [])
  const newValue = formatCellForLog(cleanItems)

  if (oldValue === newValue) return

  if (cleanItems.length === 0) {
    delete row.cells[productName]
  } else {
    row.cells[productName] = {
      items: cleanItems
    }
  }

  addLog('update_cell', {
    actionLabel: oldValue ? 'Endret produktcelle' : 'La til produktcelle',
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    productName,
    oldValue,
    newValue
  })

  persistState()
}

export function deleteOrderCell(rowId, productName) {
  const row = findOrderRow(rowId)
  if (!row || !row.cells) return

  const oldItems = row.cells[productName]?.items || []
  const oldValue = formatCellForLog(oldItems)

  if (!oldValue) return

  delete row.cells[productName]

  addLog('delete_cell', {
    actionLabel: 'Tømte produktcelle',
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    productName,
    oldValue,
    newValue: ''
  })

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

  const oldValue = Boolean(row.checks[checkType])
  const newValue = Boolean(checked)

  if (oldValue === newValue) return

  row.checks[checkType] = newValue

  addLog('update_check', {
    actionLabel: `Endret avkryssing ${checkType}`,
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    oldValue: oldValue ? 'På' : 'Av',
    newValue: newValue ? 'På' : 'Av'
  })

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

export function getCustomerName(customer) {
  if (typeof customer === 'string') return customer
  return customer?.name || ''
}

export function getCustomerByName(name) {
  const cleanName = normalizeName(name).toLowerCase()

  return state.customers.find(customer => {
    return normalizeName(getCustomerName(customer)).toLowerCase() === cleanName
  }) || null
}

export function ensureCustomerExists(name) {
  const cleanName = normalizeName(name)

  if (!cleanName) return null

  const existingCustomer = getCustomerByName(cleanName)

  if (existingCustomer) {
    return existingCustomer
  }

  const maxOrder = state.customers.reduce((max, customer) => {
    return Math.max(max, Number(customer.deliveryOrder) || 0)
  }, 0)

  const customer = {
    id: createCustomerId(cleanName),
    name: cleanName,
    contactPerson: '',
    phone: '',
    address: '',
    deliveryOrder: maxOrder + 1
  }

  state.customers.push(customer)
  state.customers = normalizeCustomers(state.customers)

  addLog('add_customer', {
    actionLabel: 'La til kunde automatisk',
    customerName: customer.name,
    newValue: customer.name
  })

  return customer
}

export function addCustomer(customerData) {
  const customer = normalizeCustomer(customerData)

  if (!customer.name) return false

  const exists = state.customers.some(item => {
    return normalizeName(item.name).toLowerCase() === customer.name.toLowerCase()
  })

  if (exists) {
    alert('Denne kunden finnes allerede')
    return false
  }

  const maxOrder = state.customers.reduce((max, item) => {
    return Math.max(max, Number(item.deliveryOrder) || 0)
  }, 0)

  customer.deliveryOrder = customer.deliveryOrder || maxOrder + 1

  state.customers.push(customer)
  state.customers = normalizeCustomers(state.customers)

  addLog('add_customer', {
    actionLabel: 'La til kunde',
    customerName: customer.name,
    newValue: customer.name
  })

  persistState()
  return true
}

export function updateCustomer(customerId, patch) {
  const customer = state.customers.find(item => item.id === customerId)
  if (!customer) return false

  const cleanPatch = normalizeCustomerPatch(patch)

  if (cleanPatch.name !== undefined) {
    const newName = normalizeName(cleanPatch.name)

    if (!newName) {
      alert('Kundenavn kan ikke være tomt')
      return false
    }

    const duplicate = state.customers.some(item => {
      return item.id !== customerId &&
        normalizeName(item.name).toLowerCase() === newName.toLowerCase()
    })

    if (duplicate) {
      alert('Denne kunden finnes allerede')
      return false
    }

    cleanPatch.name = newName
  }

  const oldValue = formatCustomerForLog(customer)

  Object.assign(customer, cleanPatch)

  state.customers = normalizeCustomers(state.customers)

  const updatedCustomer = state.customers.find(item => item.id === customerId)
  const newValue = formatCustomerForLog(updatedCustomer || customer)

  if (oldValue === newValue) return true

  addLog('update_customer', {
    actionLabel: 'Endret kundeinformasjon',
    customerName: updatedCustomer?.name || customer.name,
    oldValue,
    newValue
  })

  persistState()
  return true
}

export function moveCustomer(customerId, direction) {
  const customers = normalizeCustomers(state.customers)
  const currentIndex = customers.findIndex(customer => customer.id === customerId)

  if (currentIndex === -1) return false

  const targetIndex = direction === 'up'
    ? currentIndex - 1
    : currentIndex + 1

  if (targetIndex < 0 || targetIndex >= customers.length) {
    return false
  }

  const currentCustomer = customers[currentIndex]
  const targetCustomer = customers[targetIndex]

  customers[currentIndex] = targetCustomer
  customers[targetIndex] = currentCustomer

  state.customers = customers.map((customer, index) => ({
    ...customer,
    deliveryOrder: index + 1
  }))

  addLog('move_customer', {
    actionLabel: 'Endret leveringsrekkefølge',
    customerName: currentCustomer.name,
    oldValue: `${currentIndex + 1}`,
    newValue: `${targetIndex + 1}`
  })

  persistState()
  return true
}

export function removeCustomer(customerId) {
  const customer = state.customers.find(item => item.id === customerId)
  if (!customer) return

  state.customers = state.customers.filter(item => item.id !== customerId)

  addLog('remove_customer', {
    actionLabel: 'Fjernet kunde fra listen',
    customerName: customer.name,
    oldValue: customer.name
  })

  persistState()
}

export function addProduct(name) {
  const cleanName = normalizeName(name)
  if (!cleanName) return false

  if (state.products.includes(cleanName)) {
    alert('Dette produktet finnes allerede')
    return false
  }

  state.products.push(cleanName)

  if (!state.productPackagingTypes[cleanName]) {
    state.productPackagingTypes[cleanName] = [createDefaultPackagingOption()]
  }

  addLog('add_product', {
    actionLabel: 'La til produkt',
    productName: cleanName,
    newValue: cleanName
  })

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

  addLog('remove_product', {
    actionLabel: 'Fjernet produkt',
    productName: name,
    oldValue: name
  })

  persistState()
}

export function getPackagingOptionsForProduct(productName) {
  const customOptions = state.productPackagingTypes?.[productName] || []
  const defaultOption = getDefaultPackagingOptionForProduct(productName)

  return [
    defaultOption,
    ...customOptions
      .map(option => normalizePackagingOption(option))
      .filter(Boolean)
  ].sort((a, b) => {
    return Number(a.weightKg || 0) - Number(b.weightKg || 0)
  })
}

function normalizePackagingOption(option) {
  if (!option) return null

  const packageName = String(
    option.packageName ||
    option.name ||
    option.label ||
    ''
  ).trim()

  if (!packageName) return null

  const weightKg = Number(option.weightKg)

  return {
    id: option.id || createPackagingOptionId(packageName),
    packageName,
    label: option.label || packageName,
    weightKg: Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 1,
    isDefault: Boolean(option.isDefault)
  }
}

function getDefaultPackagingOptionForProduct(productName) {
  if (isLiterProduct(productName)) {
    return {
      id: 'default_l',
      packageName: 'l',
      label: 'l',
      weightKg: 1,
      isDefault: true
    }
  }

  return {
    id: 'default_kg',
    packageName: 'kg',
    label: 'kg',
    weightKg: 1,
    isDefault: true
  }
}

function isLiterProduct(productName) {
  return normalizeProductNameForUnit(productName) === 'melk'
}

function normalizeProductNameForUnit(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}


function normalizeProductName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function getPackagingTypesForProduct(productName) {
  return getPackagingOptionsForProduct(productName).map(option => option.label)
}

export function addProductPackagingOption(productName, packageName, weightKgInput) {
  const cleanProduct = normalizeName(productName)
  const cleanPackageName = normalizeName(packageName)

  if (!cleanProduct || !cleanPackageName) return false

  if (!state.products.includes(cleanProduct)) {
    alert('Legg til produktet først')
    return false
  }

  const option = createPackagingOption(cleanPackageName, weightKgInput)

  if (!option) {
    alert('Skriv inn gyldig emballasjenavn og vekt')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    state.productPackagingTypes[cleanProduct] = [createDefaultPackagingOption()]
  }

  const exists = state.productPackagingTypes[cleanProduct]
    .some(item => parsePackagingOption(item)?.id === option.id)

  if (exists) {
    alert('Denne emballasjen finnes allerede for dette produktet')
    return false
  }

  state.productPackagingTypes[cleanProduct].push(option)
  state.productPackagingTypes[cleanProduct] = normalizePackagingOptions(
    state.productPackagingTypes[cleanProduct]
  )

  addLog('add_packaging', {
    actionLabel: 'La til emballasje',
    productName: cleanProduct,
    newValue: option.label
  })

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
    alert('kg er standardmålet og kan ikke slettes')
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

  addLog('remove_packaging', {
    actionLabel: 'Fjernet emballasje',
    productName: cleanProduct,
    oldValue: optionToRemove?.label || cleanOptionId
  })

  persistState()
  return true
}

export function clearLogs() {
  state.logs = []
  persistState()
}

function addLog(action, details = {}) {
  const log = {
    id: createLogId(),
    createdAt: new Date().toISOString(),
    weekId: getCurrentWeekId(),
    weekLabel: getCurrentWeekLabel(),
    action,
    actionLabel: details.actionLabel || action,
    customerName: details.customerName || '',
    deliveryDay: details.deliveryDay || '',
    productName: details.productName || '',
    oldValue: details.oldValue || '',
    newValue: details.newValue || '',
    note: details.note || ''
  }

  state.logs = [log, ...(state.logs || [])].slice(0, MAX_LOGS)
}

function prepareStateForSaving() {
  return {
    customers: normalizeCustomers(state.customers),
    products: state.products,
    productPackagingTypes: state.productPackagingTypes,
    weeks: state.weeks,
    logs: state.logs
  }
}

function applySavedState(savedState) {
  if (Array.isArray(savedState.customers)) {
    state.customers = normalizeCustomers(savedState.customers)
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

  if (Array.isArray(savedState.logs)) {
    state.logs = savedState.logs
  }

  migrateAllWeeksToRows()
}

function normalizeCustomers(customers) {
  if (!Array.isArray(customers)) return []

  const normalized = customers
    .map(customer => normalizeCustomer(customer))
    .filter(customer => customer.name)

  normalized.sort((a, b) => {
    const orderA = Number(a.deliveryOrder) || 0
    const orderB = Number(b.deliveryOrder) || 0

    if (orderA !== orderB) {
      if (orderA === 0) return 1
      if (orderB === 0) return -1
      return orderA - orderB
    }

    return a.name.localeCompare(b.name)
  })

  return normalized.map((customer, index) => ({
    ...customer,
    deliveryOrder: index + 1
  }))
}

function normalizeCustomer(customer) {
  if (typeof customer === 'string') {
    const name = normalizeName(customer)

    return {
      id: createCustomerId(name),
      name,
      contactPerson: '',
      phone: '',
      address: '',
      deliveryOrder: 0
    }
  }

  const name = normalizeName(customer?.name)

  return {
    id: customer?.id || createCustomerId(name),
    name,
    contactPerson: normalizeName(customer?.contactPerson),
    phone: normalizeName(customer?.phone),
    address: normalizeName(customer?.address),
    deliveryOrder: normalizeDeliveryOrder(customer?.deliveryOrder)
  }
}

function normalizeCustomerPatch(patch) {
  const result = {}

  if (patch.name !== undefined) {
    result.name = normalizeName(patch.name)
  }

  if (patch.contactPerson !== undefined) {
    result.contactPerson = normalizeName(patch.contactPerson)
  }

  if (patch.phone !== undefined) {
    result.phone = normalizeName(patch.phone)
  }

  if (patch.address !== undefined) {
    result.address = normalizeName(patch.address)
  }

  if (patch.deliveryOrder !== undefined) {
    result.deliveryOrder = normalizeDeliveryOrder(patch.deliveryOrder)
  }

  return result
}

function normalizeDeliveryOrder(value) {
  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    return 0
  }

  return Math.round(number)
}

function formatCustomerForLog(customer) {
  return [
    customer.name,
    customer.contactPerson,
    customer.phone,
    customer.address,
    customer.deliveryOrder ? `Nr. ${customer.deliveryOrder}` : ''
  ].filter(Boolean).join(' · ')
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
    merknad: row.merknad || '',
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

function formatCellForLog(items) {
  return (items || [])
    .map(item => formatItemForLog(item))
    .filter(Boolean)
    .join(', ')
}

function formatItemForLog(item) {
  const qty = Number(item.qty) || 0
  const packageName = String(item.packageName || '').toLowerCase()
  const label = item.label || item.packageName || item.type || ''

  if (!qty || !label) return ''

  if (packageName === 'kg' || String(label).toLowerCase() === 'kg') {
    return `${formatNumber(qty)}kg`
  }

  if (packageName.includes('spann') || String(label).toLowerCase().includes('spann')) {
    return `${formatNumber(qty)} spann`
  }

  return `${formatNumber(qty)}x${label}`
}

function formatNumber(value) {
  return Number(value).toLocaleString('nb-NO', {
    maximumFractionDigits: 2
  })
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
    merknad: '',
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

function createLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function createCustomerId(name) {
  const base = slugify(name || 'kunde') || 'kunde'
  return `customer_${base}_${Math.random().toString(36).slice(2, 7)}`
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

export function moveProduct(productName, direction) {
  const currentIndex = state.products.indexOf(productName)

  if (currentIndex === -1) return false

  const targetIndex = direction === 'up'
    ? currentIndex - 1
    : currentIndex + 1

  if (targetIndex < 0 || targetIndex >= state.products.length) {
    return false
  }

  const oldValue = state.products.join(', ')

  const products = [...state.products]
  const currentProduct = products[currentIndex]

  products[currentIndex] = products[targetIndex]
  products[targetIndex] = currentProduct

  state.products = products

  const newValue = state.products.join(', ')

  addLog('move_product', {
    actionLabel: 'Endret produktrekkefølge',
    productName,
    oldValue,
    newValue
  })

  persistState()
  return true
}