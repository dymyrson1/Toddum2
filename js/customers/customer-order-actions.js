import { formatCustomerForLog, normalizeCustomers } from './customer-utils.js'

export function moveCustomerAction(context, customerId, direction) {
  const { addLog, persistState, state } = context
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

  if (typeof addLog === 'function') {
    addLog('move_customer', {
      actionLabel: 'Endret kunderekkefølge',
      customerName: currentCustomer.name,
      oldValue: `Nr. ${currentIndex + 1}`,
      newValue: `Nr. ${targetIndex + 1}`
    })
  }

  persistState()

  return true
}

export function removeCustomerAction(context, customerId) {
  const { addLog, persistState, state } = context
  const customer = state.customers.find((item) => item.id === customerId)

  if (!customer) return false

  const oldValue = formatCustomerForLog(customer)

  state.customers = state.customers.filter((item) => item.id !== customerId)

  if (typeof addLog === 'function') {
    addLog('remove_customer', {
      actionLabel: 'Slettet kunde',
      customerName: customer.name,
      oldValue
    })
  }

  persistState()

  return true
}
