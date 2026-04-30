import { loadFirebaseState, saveFirebaseState } from './firebase.js'
import { setSyncStatus } from './sync/sync-status.js'

import { DELIVERY_DAYS, MAX_LOGS } from './app/constants.js'

import {
  applySavedStateToRuntimeState,
  prepareRuntimeStateForSaving
} from './app/state-persistence-utils.js'

import { normalizeName } from './utils/text.js'

import {
  getISOWeek,
  getWeekId,
  getWeekLabel,
  shiftDateByWeeks
} from './week/week-utils.js'

import {
  formatCustomerForLog,
  normalizeCustomer,
  normalizeCustomerPatch,
  normalizeCustomers
} from './customers/customer-utils.js'

import {
  collectCustomerNamesFromWeeks,
  createCustomerFromName,
  customerNameExists,
  findCustomerByName,
  getCustomerNameValue,
  getNextCustomerDeliveryOrder
} from './customers/customer-state-utils.js'

import {
  createDefaultPackagingOption,
  createPackagingOption,
  formatCellForLog,
  getDefaultPackagingOptionForProduct,
  normalizePackagingOption,
  normalizePackagingOptions,
  parsePackagingOption
} from './products/packaging-utils.js'

import {
  normalizeProductPackagingTypesForProducts,
  removePackagingOptionFromWeeks
} from './products/packaging-state-utils.js'

import {
  moveProductInList,
  normalizeProducts,
  productExists,
  removeProductFromWeeks
} from './products/product-utils.js'

import { createLogEntry } from './logs/log-utils.js'

import { createEmptyOrderRow, normalizeOrderRows } from './orders/order-utils.js'

import {
  normalizeOrderCells,
  normalizeOrderCellItems
} from './orders/order-cell-utils.js'

import { migrateCellsToOrderRows } from './orders/order-migration-utils.js'

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
      applySavedStateToRuntimeState(state, firebaseState)
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
  state.products = normalizeProducts(state.products)

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
    saveFirebaseState(prepareRuntimeStateForSaving(state))
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
  return getWeekId(state.currentYear, state.currentWeek)
}

export function getCurrentWeekLabel() {
  return getWeekLabel(state.currentWeek)
}

export function ensureCurrentWeek() {
  const weekId = getCurrentWeekId()

  if (!state.weeks[weekId]) {
    state.weeks[weekId] = {
      rows: []
    }
  }

  if (!Array.isArray(state.weeks[weekId].rows)) {
    state.weeks[weekId].rows = migrateCellsToOrderRows(
      state.weeks[weekId].cells || {}
    )
    delete state.weeks[weekId].cells
  }

  state.weeks[weekId].rows = normalizeRows(state.weeks[weekId].rows)
}

export function getCurrentRows() {
  ensureCurrentWeek()

  return state.weeks[getCurrentWeekId()].rows
}

export function goToPreviousWeek() {
  state.currentDate = shiftDateByWeeks(state.currentDate, -1)

  updateCurrentYearWeek()
  ensureCurrentWeek()
  persistState()
}

export function goToNextWeek() {
  state.currentDate = shiftDateByWeeks(state.currentDate, 1)

  updateCurrentYearWeek()
  ensureCurrentWeek()
  persistState()
}

export function addOrderRow() {
  const rows = getCurrentRows()
  const row = createEmptyOrderRow()

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

export function updateOrderCell(rowId, productName, value) {
  const row = findOrderRow(rowId)

  if (!row) return

  if (!row.cells) {
    row.cells = {}
  }

  const oldItems = row.cells[productName]?.items || []
  const oldValue = formatCellForLog(oldItems)

  const cleanItems = normalizeOrderCellItems(
    value?.items || [],
    getPackagingOptionsForProduct(productName)
  )
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
    return {
      items: []
    }
  }

  const cell = row.cells[productName] || {
    items: []
  }

  return {
    items: normalizeOrderCellItems(
      cell.items || [],
      getPackagingOptionsForProduct(productName)
    )
  }
}

export function getCustomerName(customer) {
  return getCustomerNameValue(customer)
}

export function getCustomerByName(name) {
  return findCustomerByName(state.customers, name)
}

export function ensureCustomerExists(name) {
  const cleanName = normalizeName(name)

  if (!cleanName) return null

  const existingCustomer = getCustomerByName(cleanName)

  if (existingCustomer) {
    return existingCustomer
  }

  const customer = createCustomerFromName(
    cleanName,
    getNextCustomerDeliveryOrder(state.customers)
  )

  if (!customer) return null

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

  if (customerNameExists(state.customers, customer.name)) {
    alert('Denne kunden finnes allerede')
    return false
  }

  customer.deliveryOrder =
    customer.deliveryOrder || getNextCustomerDeliveryOrder(state.customers)

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

    if (customerNameExists(state.customers, newName, customerId)) {
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

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

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

  if (productExists(state.products, cleanName)) {
    alert('Dette produktet finnes allerede')
    return false
  }

  state.products = normalizeProducts([...state.products, cleanName])

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
  state.products = normalizeProducts(state.products).filter(product => product !== name)

  delete state.productPackagingTypes[name]

  removeProductFromWeeks(state.weeks, name)

  addLog('remove_product', {
    actionLabel: 'Fjernet produkt',
    productName: name,
    oldValue: name
  })

  persistState()
}

export function moveProduct(productName, direction) {
  const oldValue = normalizeProducts(state.products).join(', ')
  const result = moveProductInList(state.products, productName, direction)

  if (!result.moved) return false

  state.products = result.products

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

export function getPackagingOptionsForProduct(productName) {
  const customOptions = state.productPackagingTypes?.[productName] || []
  const defaultOption = getDefaultPackagingOptionForProduct(productName)

  return [
    defaultOption,
    ...customOptions
      .map(option => normalizePackagingOption(option))
      .filter(Boolean)
      .filter(option => !option.isDefault)
  ].sort((a, b) => {
    return Number(a.weightKg || 0) - Number(b.weightKg || 0)
  })
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

  const exists = state.productPackagingTypes[cleanProduct].some(item => {
    return parsePackagingOption(item)?.id === option.id
  })

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

  const optionToRemove = getPackagingOptionsForProduct(cleanProduct).find(option => {
    return option.id === cleanOptionId
  })

  if (optionToRemove?.isDefault) {
    alert('kg/l er standardmål og kan ikke slettes')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    return false
  }

  state.productPackagingTypes[cleanProduct] = state.productPackagingTypes[cleanProduct]
    .map(option => parsePackagingOption(option))
    .filter(Boolean)
    .filter(option => option.id !== cleanOptionId)

  removePackagingOptionFromWeeks(state.weeks, cleanProduct, cleanOptionId)

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

function ensureCustomersFromOrderRows() {
  const customerNames = collectCustomerNamesFromWeeks(state.weeks)

  customerNames.forEach(customerName => {
    ensureCustomerExists(customerName)
  })
}

function addLog(action, details = {}) {
  const log = createLogEntry({
    action,
    details,
    weekId: getCurrentWeekId(),
    weekLabel: getCurrentWeekLabel()
  })

  state.logs = [log, ...(state.logs || [])].slice(0, MAX_LOGS)
}

function ensureProductPackagingTypes() {
  state.productPackagingTypes = normalizeProductPackagingTypesForProducts(
    state.products,
    state.productPackagingTypes
  )
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
  return normalizeOrderRows(rows, normalizeRowCells)
}

function normalizeRowCells(cells) {
  return normalizeOrderCells(cells, getPackagingOptionsForProduct)
}

function updateCurrentYearWeek() {
  const result = getISOWeek(state.currentDate)

  state.currentYear = result.year
  state.currentWeek = result.week
}