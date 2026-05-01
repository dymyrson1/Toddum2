import { state } from './runtime-state.js'

import { createActionContext as createActionContextObject } from './action-context.js'
import { createPersistenceController } from './persistence-controller.js'
import { loadRuntimeStateFromFirebase } from './state-loader.js'

import {
  ensureCustomersFromOrderRowsInState,
  normalizeAllWeeksInState,
  normalizeRuntimeStateAfterLoad
} from './state-init-utils.js'

import { createStateCustomerApi } from './state-customer-api.js'
import { createStateLogApi } from './state-log-api.js'
import { createStateOrderApi } from './state-order-api.js'
import { createStateProductApi } from './state-product-api.js'
import { createStateWeekApi } from './state-week-api.js'

import { normalizeProductPackagingTypesForProducts } from '../products/packaging-state-utils.js'

import { normalizeOrderCells } from '../orders/order-cell-utils.js'
import { normalizeOrderRows } from '../orders/order-utils.js'

export { state }

const persistenceController = createPersistenceController(state)

const weekApi = createStateWeekApi({
  state,
  persistState,
  normalizeRows
})

let customerApi
let productApi
let orderApi
let logApi

customerApi = createStateCustomerApi({
  state,
  createActionContext
})

productApi = createStateProductApi({
  state,
  createActionContext
})

orderApi = createStateOrderApi({
  createActionContext
})

logApi = createStateLogApi({
  createActionContext
})

export async function initState() {
  await loadRuntimeStateFromFirebase(state)

  normalizeRuntimeStateAfterLoad(state)
  ensureProductPackagingTypes()
  normalizeAllWeekData()
  ensureCustomersFromOrderRows()
  weekApi.updateCurrentYearWeek()
  weekApi.ensureCurrentWeek()
  persistState()
}

export function persistState() {
  return persistenceController.persistState()
}

export const getCurrentWeekId = weekApi.getCurrentWeekId
export const getCurrentWeekLabel = weekApi.getCurrentWeekLabel
export const ensureCurrentWeek = weekApi.ensureCurrentWeek
export const getCurrentRows = weekApi.getCurrentRows
export const goToPreviousWeek = weekApi.goToPreviousWeek
export const goToNextWeek = weekApi.goToNextWeek

export const addOrderRow = orderApi.addOrderRow
export const deleteOrderRow = orderApi.deleteOrderRow
export const updateOrderRowField = orderApi.updateOrderRowField
export const updateOrderCell = orderApi.updateOrderCell
export const deleteOrderCell = orderApi.deleteOrderCell
export const updateRowCheck = orderApi.updateRowCheck
export const findOrderRow = orderApi.findOrderRow
export const getOrderCell = orderApi.getOrderCell

export const getCustomerName = customerApi.getCustomerName
export const getCustomerByName = customerApi.getCustomerByName
export const ensureCustomerExists = customerApi.ensureCustomerExists
export const addCustomer = customerApi.addCustomer
export const updateCustomer = customerApi.updateCustomer
export const moveCustomer = customerApi.moveCustomer
export const removeCustomer = customerApi.removeCustomer

export const addProduct = productApi.addProduct
export const removeProduct = productApi.removeProduct
export const moveProduct = productApi.moveProduct
export const getPackagingOptionsForProduct = productApi.getPackagingOptionsForProduct
export const getPackagingTypesForProduct = productApi.getPackagingTypesForProduct
export const addProductPackagingOption = productApi.addProductPackagingOption
export const removeProductPackagingOption = productApi.removeProductPackagingOption

export const clearLogs = logApi.clearLogs

function createActionContext() {
  return createActionContextObject({
    state,
    persistState,
    getCurrentRows,
    getCurrentWeekId,
    getCurrentWeekLabel,
    getPackagingOptionsForProduct,
    ensureCustomerExists,
    addLog: logApi.addLog
  })
}

function ensureCustomersFromOrderRows() {
  return ensureCustomersFromOrderRowsInState(state, customerApi.ensureCustomerExists)
}

function ensureProductPackagingTypes() {
  state.productPackagingTypes = normalizeProductPackagingTypesForProducts(
    state.products,
    state.productPackagingTypes
  )
}

function normalizeAllWeekData() {
  return normalizeAllWeeksInState(state, normalizeRows)
}

function normalizeRows(rows) {
  return normalizeOrderRows(rows, normalizeRowCells)
}

function normalizeRowCells(cells) {
  return normalizeOrderCells(cells, productApi.getPackagingOptionsForProduct)
}
