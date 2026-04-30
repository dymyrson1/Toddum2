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

import { formatCellForLog } from './products/packaging-utils.js'

import {
  normalizeProductPackagingTypesForProducts
} from './products/packaging-state-utils.js'

import { normalizeProducts } from './products/product-utils.js'

import {
  addProductAction,
  addProductPackagingOptionAction,
  getPackagingOptionsForProductFromState,
  getPackagingTypesForProductFromState,
  moveProductAction,
  removeProductAction,
  removeProductPackagingOptionAction
} from './products/product-actions.js'

import { createLogEntry } from './logs/log-utils.js'

import { createEmptyOrderRow, normalizeOrderRows } from './orders/order-utils.js'

import {
  normalizeOrderCells,
  normalizeOrderCellItems
} from './orders/order-cell-utils.js'

import { migrateCellsToOrderRows } from './orders/order-migration-utils.js'

import {
  findOrderRowById,
  removeOrderRowById,
  updateOrderRowCheckValue,
  updateOrderRowFieldValue
} from './orders/order-state-utils.js'

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
  const result = removeOrderRowById(getCurrentRows(), rowId)

  if (!result.removed) return

  if (state.selectedCell?.rowId === rowId) {
    state.selectedCell = null
  }

  addLog('delete_row', {
    actionLabel: 'Slettet rad',
    customerName: result.row.customerName || '',
    deliveryDay: result.row.deliveryDay || ''
  })

  persistState()
}

export function updateOrderRowField(rowId, field, value) {
  const row = findOrderRow(rowId)
  const result = updateOrderRowFieldValue(row, field, value)

  if (!result.changed) return

  if (field === 'customerName' && result.newValue) {
    ensureCustomerExists(result.newValue)
  }

  addLog('update_row_field', {
    actionLabel: field === 'customerName' ? 'Endret kunde' : 'Endret leveringsdag',
    customerName: field === 'customerName' ? result.newValue : row.customerName || '',
    deliveryDay: field === 'deliveryDay' ? result.newValue : row.deliveryDay || '',
    oldValue: result.oldValue,
    newValue: result.newValue
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
  const result = updateOrderRowCheckValue(row, checkType, checked)

  if (!result.changed) return

  addLog('update_check', {
    actionLabel: `Endret avkryssing ${checkType}`,
    customerName: row.customerName || '',
    deliveryDay: row.deliveryDay || '',
    oldValue: result.oldValue ? 'På' : 'Av',
    newValue: result.newValue ? 'På' : 'Av'
  })

  persistState()
}

export function findOrderRow(rowId) {
  return findOrderRowById(getCurrentRows(), rowId)
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
  return addProductAction(createActionContext(), name)
}

export function removeProduct(name) {
  return removeProductAction(createActionContext(), name)
}

export function moveProduct(productName, direction) {
  return moveProductAction(createActionContext(), productName, direction)
}

export function getPackagingOptionsForProduct(productName) {
  return getPackagingOptionsForProductFromState(state, productName)
}

export function getPackagingTypesForProduct(productName) {
  return getPackagingTypesForProductFromState(state, productName)
}

export function addProductPackagingOption(productName, packageName, weightKgInput) {
  return addProductPackagingOptionAction(
    createActionContext(),
    productName,
    packageName,
    weightKgInput
  )
}

export function removeProductPackagingOption(productName, optionId) {
  return removeProductPackagingOptionAction(
    createActionContext(),
    productName,
    optionId
  )
}

export function clearLogs() {
  state.logs = []
  persistState()
}

function createActionContext() {
  return {
    state,
    addLog,
    persistState
  }
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