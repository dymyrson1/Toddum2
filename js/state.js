import { DELIVERY_DAYS } from './app/constants.js'

import { createPersistenceController } from './app/persistence-controller.js'
import { loadRuntimeStateFromFirebase } from './app/state-loader.js'

import {
  ensureCustomersFromOrderRowsInState,
  normalizeAllWeeksInState,
  normalizeRuntimeStateAfterLoad
} from './app/state-init-utils.js'

import {
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

import {
  addProductAction,
  addProductPackagingOptionAction,
  getPackagingOptionsForProductFromState,
  getPackagingTypesForProductFromState,
  moveProductAction,
  removeProductAction,
  removeProductPackagingOptionAction
} from './products/product-actions.js'

import { addLogAction, clearLogsAction } from './logs/log-actions.js'

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

import {
  ensureWeekExistsInState,
  getCurrentWeekIdFromState,
  getCurrentWeekLabelFromState,
  shiftCurrentDateByWeeksInState,
  updateCurrentYearWeekInState
} from './week/week-state-utils.js'

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

const persistenceController = createPersistenceController(state)

export async function initState() {
  await loadRuntimeStateFromFirebase(state)

  normalizeRuntimeStateAfterLoad(state)
  ensureProductPackagingTypes()
  normalizeAllWeekData()
  ensureCustomersFromOrderRows()
  updateCurrentYearWeek()
  ensureCurrentWeek()
  persistState()
}

export function persistState() {
  return persistenceController.persistState()
}

export function getCurrentWeekId() {
  return getCurrentWeekIdFromState(state)
}

export function getCurrentWeekLabel() {
  return getCurrentWeekLabelFromState(state)
}

export function ensureCurrentWeek() {
  ensureWeekExistsInState({
    state,
    weekId: getCurrentWeekId(),
    migrateCellsToOrderRows,
    normalizeRows
  })
}

export function getCurrentRows() {
  ensureCurrentWeek()

  return state.weeks[getCurrentWeekId()].rows
}

export function goToPreviousWeek() {
  shiftCurrentDateByWeeksInState(state, -1)

  ensureCurrentWeek()
  persistState()
}

export function goToNextWeek() {
  shiftCurrentDateByWeeksInState(state, 1)

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
  return clearLogsAction(createActionContext())
}

function createActionContext() {
  return {
    state,
    addLog,
    persistState,
    getCurrentRows,
    getCurrentWeekId,
    getCurrentWeekLabel,
    getPackagingOptionsForProduct,
    ensureCustomerExists
  }
}

function addLog(action, details = {}) {
  return addLogAction(createActionContext(), action, details)
}

function ensureCustomersFromOrderRows() {
  return ensureCustomersFromOrderRowsInState(state, ensureCustomerExists)
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
  return normalizeOrderCells(cells, getPackagingOptionsForProduct)
}

function updateCurrentYearWeek() {
  return updateCurrentYearWeekInState(state)
}