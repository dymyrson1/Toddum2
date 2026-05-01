import { normalizeName } from '../utils/text.js'

import {
  formatCustomerForLog,
  normalizeCustomerPatch,
  normalizeCustomers
} from './customer-utils.js'

import { customerNameExists } from './customer-state-utils.js'

export function updateCustomerAction(context, customerId, patch) {
  const { addLog, persistState, state } = context
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

  if (typeof addLog === 'function') {
    addLog('update_customer', {
      actionLabel: 'Endret kunde',
      customerName: updatedCustomer?.name || customer.name,
      oldValue,
      newValue
    })
  }

  persistState()

  return true
}
