import { normalizeName } from '../utils/text.js'

import {
  formatCustomerForLog,
  normalizeCustomer,
  normalizeCustomerPatch,
  normalizeCustomers
} from './customer-utils.js'

import {
  createCustomerFromName,
  customerNameExists,
  findCustomerByName,
  getNextCustomerDeliveryOrder
} from './customer-state-utils.js'

export function ensureCustomerExistsAction(context, name) {
  const { state, addLog } = context
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

  addLog('add_customer', {
    actionLabel: 'La til kunde automatisk',
    customerName: customer.name,
    newValue: customer.name
  })

  return customer
}

export function addCustomerAction(context, customerData) {
  const { state, addLog, persistState } = context
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

export function updateCustomerAction(context, customerId, patch) {
  const { state, addLog, persistState } = context
  const customer = state.customers.find((item) => item.id === customerId)

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

  const updatedCustomer = state.customers.find((item) => item.id === customerId)
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

export function moveCustomerAction(context, customerId, direction) {
  const { state, addLog, persistState } = context
  const customers = normalizeCustomers(state.customers)
  const currentIndex = customers.findIndex((customer) => customer.id === customerId)

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

export function removeCustomerAction(context, customerId) {
  const { state, addLog, persistState } = context
  const customer = state.customers.find((item) => item.id === customerId)

  if (!customer) return false

  state.customers = state.customers.filter((item) => item.id !== customerId)

  addLog('remove_customer', {
    actionLabel: 'Fjernet kunde fra listen',
    customerName: customer.name,
    oldValue: customer.name
  })

  persistState()

  return true
}
