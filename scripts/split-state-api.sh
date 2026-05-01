#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split state-api.js into focused facade modules"
echo ""

FILES=(
  "js/app/state-api.js"
  "js/app/action-context.js"
  "js/app/state-week-api.js"
  "js/app/state-order-api.js"
  "js/app/state-customer-api.js"
  "js/app/state-product-api.js"
  "js/app/state-log-api.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-state-api.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/app

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/app/action-context.js <<'JS'
export function createActionContext(deps) {
  return {
    state: deps.state,
    persistState: deps.persistState,
    getCurrentRows: deps.getCurrentRows,
    getCurrentWeekId: deps.getCurrentWeekId,
    getCurrentWeekLabel: deps.getCurrentWeekLabel,
    getPackagingOptionsForProduct: deps.getPackagingOptionsForProduct,
    ensureCustomerExists: deps.ensureCustomerExists,
    addLog: deps.addLog
  }
}
JS

cat > js/app/state-week-api.js <<'JS'
import { migrateCellsToOrderRows } from '../orders/order-migration-utils.js'

import {
  ensureWeekExistsInState,
  getCurrentWeekIdFromState,
  getCurrentWeekLabelFromState,
  shiftCurrentDateByWeeksInState,
  updateCurrentYearWeekInState
} from '../week/week-state-utils.js'

export function createStateWeekApi({
  state,
  persistState,
  normalizeRows
}) {
  function getCurrentWeekId() {
    return getCurrentWeekIdFromState(state)
  }

  function getCurrentWeekLabel() {
    return getCurrentWeekLabelFromState(state)
  }

  function ensureCurrentWeek() {
    ensureWeekExistsInState({
      state,
      weekId: getCurrentWeekId(),
      migrateCellsToOrderRows,
      normalizeRows
    })
  }

  function getCurrentRows() {
    ensureCurrentWeek()

    return state.weeks[getCurrentWeekId()].rows
  }

  function goToPreviousWeek() {
    shiftCurrentDateByWeeksInState(state, -1)

    ensureCurrentWeek()
    persistState()
  }

  function goToNextWeek() {
    shiftCurrentDateByWeeksInState(state, 1)

    ensureCurrentWeek()
    persistState()
  }

  function updateCurrentYearWeek() {
    return updateCurrentYearWeekInState(state)
  }

  return {
    getCurrentWeekId,
    getCurrentWeekLabel,
    ensureCurrentWeek,
    getCurrentRows,
    goToPreviousWeek,
    goToNextWeek,
    updateCurrentYearWeek
  }
}
JS

cat > js/app/state-order-api.js <<'JS'
import {
  addOrderRowAction,
  deleteOrderCellAction,
  deleteOrderRowAction,
  findOrderRowAction,
  getOrderCellAction,
  updateOrderCellAction,
  updateOrderRowFieldAction,
  updateRowCheckAction
} from '../orders/order-actions.js'

export function createStateOrderApi({ createActionContext }) {
  function addOrderRow() {
    return addOrderRowAction(createActionContext())
  }

  function deleteOrderRow(rowId) {
    return deleteOrderRowAction(createActionContext(), rowId)
  }

  function updateOrderRowField(rowId, field, value) {
    return updateOrderRowFieldAction(createActionContext(), rowId, field, value)
  }

  function updateOrderCell(rowId, productName, value) {
    return updateOrderCellAction(createActionContext(), rowId, productName, value)
  }

  function deleteOrderCell(rowId, productName) {
    return deleteOrderCellAction(createActionContext(), rowId, productName)
  }

  function updateRowCheck(rowId, checkType, checked) {
    return updateRowCheckAction(createActionContext(), rowId, checkType, checked)
  }

  function findOrderRow(rowId) {
    return findOrderRowAction(createActionContext(), rowId)
  }

  function getOrderCell(rowId, productName) {
    return getOrderCellAction(createActionContext(), rowId, productName)
  }

  return {
    addOrderRow,
    deleteOrderRow,
    updateOrderRowField,
    updateOrderCell,
    deleteOrderCell,
    updateRowCheck,
    findOrderRow,
    getOrderCell
  }
}
JS

cat > js/app/state-customer-api.js <<'JS'
import {
  findCustomerByName,
  getCustomerNameValue
} from '../customers/customer-state-utils.js'

import {
  addCustomerAction,
  ensureCustomerExistsAction,
  moveCustomerAction,
  removeCustomerAction,
  updateCustomerAction
} from '../customers/customer-actions.js'

export function createStateCustomerApi({
  state,
  createActionContext
}) {
  function getCustomerName(customer) {
    return getCustomerNameValue(customer)
  }

  function getCustomerByName(name) {
    return findCustomerByName(state.customers, name)
  }

  function ensureCustomerExists(name) {
    return ensureCustomerExistsAction(createActionContext(), name)
  }

  function addCustomer(customerData) {
    return addCustomerAction(createActionContext(), customerData)
  }

  function updateCustomer(customerId, patch) {
    return updateCustomerAction(createActionContext(), customerId, patch)
  }

  function moveCustomer(customerId, direction) {
    return moveCustomerAction(createActionContext(), customerId, direction)
  }

  function removeCustomer(customerId) {
    return removeCustomerAction(createActionContext(), customerId)
  }

  return {
    getCustomerName,
    getCustomerByName,
    ensureCustomerExists,
    addCustomer,
    updateCustomer,
    moveCustomer,
    removeCustomer
  }
}
JS

cat > js/app/state-product-api.js <<'JS'
import {
  addProductAction,
  addProductPackagingOptionAction,
  getPackagingOptionsForProductFromState,
  getPackagingTypesForProductFromState,
  moveProductAction,
  removeProductAction,
  removeProductPackagingOptionAction
} from '../products/product-actions.js'

export function createStateProductApi({
  state,
  createActionContext
}) {
  function addProduct(name) {
    return addProductAction(createActionContext(), name)
  }

  function removeProduct(name) {
    return removeProductAction(createActionContext(), name)
  }

  function moveProduct(productName, direction) {
    return moveProductAction(createActionContext(), productName, direction)
  }

  function getPackagingOptionsForProduct(productName) {
    return getPackagingOptionsForProductFromState(state, productName)
  }

  function getPackagingTypesForProduct(productName) {
    return getPackagingTypesForProductFromState(state, productName)
  }

  function addProductPackagingOption(productName, packageName, weightKgInput) {
    return addProductPackagingOptionAction(
      createActionContext(),
      productName,
      packageName,
      weightKgInput
    )
  }

  function removeProductPackagingOption(productName, optionId) {
    return removeProductPackagingOptionAction(
      createActionContext(),
      productName,
      optionId
    )
  }

  return {
    addProduct,
    removeProduct,
    moveProduct,
    getPackagingOptionsForProduct,
    getPackagingTypesForProduct,
    addProductPackagingOption,
    removeProductPackagingOption
  }
}
JS

cat > js/app/state-log-api.js <<'JS'
import {
  addLogAction,
  clearLogsAction
} from '../logs/log-actions.js'

export function createStateLogApi({ createActionContext }) {
  function addLog(action, details = {}) {
    return addLogAction(createActionContext(), action, details)
  }

  function clearLogs() {
    return clearLogsAction(createActionContext())
  }

  return {
    addLog,
    clearLogs
  }
}
JS

cat > js/app/state-api.js <<'JS'
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
export const getPackagingOptionsForProduct =
  productApi.getPackagingOptionsForProduct
export const getPackagingTypesForProduct =
  productApi.getPackagingTypesForProduct
export const addProductPackagingOption = productApi.addProductPackagingOption
export const removeProductPackagingOption =
  productApi.removeProductPackagingOption

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
  return ensureCustomersFromOrderRowsInState(
    state,
    customerApi.ensureCustomerExists
  )
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
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
