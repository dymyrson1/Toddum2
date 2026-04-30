import { DELIVERY_DAYS } from './constants.js'
import { normalizeCustomers } from '../customers/customer-utils.js'
import { normalizeProducts } from '../products/product-utils.js'
import { migrateWeeksToRows } from '../orders/order-migration-utils.js'

export function applySavedStateToRuntimeState(state, savedState) {
  if (!state || !savedState || typeof savedState !== 'object') {
    return state
  }

  if (Array.isArray(savedState.customers)) {
    state.customers = normalizeCustomers(savedState.customers)
  }

  if (Array.isArray(savedState.products)) {
    state.products = normalizeProducts(savedState.products)
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

  migrateWeeksToRows(state.weeks)

  return state
}

export function prepareRuntimeStateForSaving(state) {
  return {
    customers: normalizeCustomers(state.customers),
    products: normalizeProducts(state.products),
    productPackagingTypes: state.productPackagingTypes || {},
    weeks: state.weeks || {},
    logs: Array.isArray(state.logs) ? state.logs : []
  }
}
