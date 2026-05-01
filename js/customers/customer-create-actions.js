import { normalizeName } from '../utils/text.js'

import { normalizeCustomer, normalizeCustomers } from './customer-utils.js'

import {
  createCustomerFromName,
  customerNameExists,
  findCustomerByName,
  getNextCustomerDeliveryOrder
} from './customer-state-utils.js'

export function ensureCustomerExistsAction(context, name) {
  const { addLog, state } = context
  const cleanName = normalizeName(name)

  if (!cleanName) return null

  const existingCustomer = findCustomerByName(state.customers, cleanName)

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

  if (typeof addLog === 'function') {
    addLog('add_customer', {
      actionLabel: 'La til kunde automatisk',
      customerName: customer.name,
      newValue: customer.name
    })
  }

  return customer
}

export function addCustomerAction(context, customerData) {
  const { addLog, persistState, state } = context
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

  if (typeof addLog === 'function') {
    addLog('add_customer', {
      actionLabel: 'La til kunde',
      customerName: customer.name,
      newValue: customer.name
    })
  }

  persistState()

  return true
}
