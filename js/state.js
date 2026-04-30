import { loadFirebaseState, saveFirebaseState } from './firebase.js'
import { setSyncStatus } from './sync/sync-status.js'

import { DELIVERY_DAYS, MAX_LOGS } from './app/constants.js'

import {
  applySavedStateToRuntimeState,
  prepareRuntimeStateForSaving
} from './app/state-persistence-utils.js'

import {
  getISOWeek,
  getWeekId,
  getWeekLabel,
  shiftDateByWeeks
} from './week/week-utils.js'

import { normalizeCustomers } from './customers/customer-utils.js'

import {
  collectCustomerNamesFromWeeks,
  findCustomerByName,
  getCustomerNameValue
} from './customers/customer-state-utils.js'

import {
  addCustomerAction,
  ensureCustomerExistsAction,
  moveCustomerAction,
  removeCustomerAction,
  updateCustomerAction
} from './customers/customer-actions.js'

import { normalizeProductPackagingTypesForProducts } from './products/packaging-state-utils.js'
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

import { normalizeOrderRows } from './orders/order-utils.js'

import { normalizeOrderCells } from './orders/order-cell-utils.js'

import { migrateCellsToOrderRows } from './orders/order-migration-utils.js'

import {
  addOrderRowAction,
  deleteOrderCellAction,
  deleteOrderRowAction,
  findOrderRowAction,
  getOrderCellAction,
  updateOrderCellAction,
  updateOrderRowFieldAction,
  updateRowCheckAction
} from './orders/order-actions.js'

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
  return addOrderRowAction(createActionContext())
}

export function deleteOrderRow(rowId) {
  return deleteOrderRowAction(createActionContext(), rowId)
}

export function updateOrderRowField(rowId, field, value) {
  return updateOrderRowFieldAction(createActionContext(), rowId, field, value)
}

export function updateOrderCell(rowId, productName, value) {
  return updateOrderCellAction(createActionContext(), rowId, productName, value)
}

export function deleteOrderCell(rowId, productName) {
  return deleteOrderCellAction(createActionContext(), rowId, productName)
}

export function updateRowCheck(rowId, checkType, checked) {
  return updateRowCheckAction(createActionContext(), rowId, checkType, checked)
}

export function findOrderRow(rowId) {
  return findOrderRowAction(createActionContext(), rowId)
}

export function getOrderCell(rowId, productName) {
  return getOrderCellAction(createActionContext(), rowId, productName)
}

export function getCustomerName(customer) {
  return getCustomerNameValue(customer)
}

export function getCustomerByName(name) {
  return findCustomerByName(state.customers, name)
}

export function ensureCustomerExists(name) {
  return ensureCustomerExistsAction(createActionContext(), name)
}

export function addCustomer(customerData) {
  return addCustomerAction(createActionContext(), customerData)
}

export function updateCustomer(customerId, patch) {
  return updateCustomerAction(createActionContext(), customerId, patch)
}

export function moveCustomer(customerId, direction) {
  return moveCustomerAction(createActionContext(), customerId, direction)
}

export function removeCustomer(customerId) {
  return removeCustomerAction(createActionContext(), customerId)
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
    persistState,
    getCurrentRows,
    getPackagingOptionsForProduct,
    ensureCustomerExists
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