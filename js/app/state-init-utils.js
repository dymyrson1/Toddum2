import { DELIVERY_DAYS } from './constants.js'
import { normalizeCustomers } from '../customers/customer-utils.js'
import { collectCustomerNamesFromWeeks } from '../customers/customer-state-utils.js'
import { normalizeProducts } from '../products/product-utils.js'

export function normalizeRuntimeStateAfterLoad(state) {
  state.currentDate = new Date()
  state.deliveryDays = DELIVERY_DAYS
  state.customers = normalizeCustomers(state.customers)
  state.products = normalizeProducts(state.products)
}

export function normalizeAllWeeksInState(state, normalizeRows) {
  Object.values(state.weeks).forEach((week) => {
    if (!Array.isArray(week.rows)) {
      week.rows = []
    }

    week.rows = normalizeRows(week.rows)
  })
}

export function ensureCustomersFromOrderRowsInState(state, ensureCustomerExists) {
  const customerNames = collectCustomerNamesFromWeeks(state.weeks)

  customerNames.forEach((customerName) => {
    ensureCustomerExists(customerName)
  })
}
