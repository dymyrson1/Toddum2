import { normalizeName } from '../utils/text.js'
import { createCustomerId } from './customer-utils.js'

export function getCustomerNameValue(customer) {
  if (typeof customer === 'string') return customer

  return customer?.name || ''
}

export function findCustomerByName(customers, name) {
  const cleanName = normalizeName(name).toLowerCase()

  if (!cleanName) return null

  return (
    customers.find(customer => {
      return normalizeName(getCustomerNameValue(customer)).toLowerCase() === cleanName
    }) || null
  )
}

export function customerNameExists(customers, name, excludeCustomerId = null) {
  const cleanName = normalizeName(name).toLowerCase()

  if (!cleanName) return false

  return customers.some(customer => {
    if (excludeCustomerId && customer.id === excludeCustomerId) {
      return false
    }

    return normalizeName(getCustomerNameValue(customer)).toLowerCase() === cleanName
  })
}

export function getNextCustomerDeliveryOrder(customers) {
  const maxOrder = customers.reduce((max, customer) => {
    return Math.max(max, Number(customer.deliveryOrder) || 0)
  }, 0)

  return maxOrder + 1
}

export function createCustomerFromName(name, deliveryOrder) {
  const cleanName = normalizeName(name)

  if (!cleanName) return null

  return {
    id: createCustomerId(cleanName),
    name: cleanName,
    contactPerson: '',
    phone: '',
    address: '',
    deliveryOrder
  }
}

export function collectCustomerNamesFromWeeks(weeks) {
  const names = new Set()

  Object.values(weeks || {}).forEach(week => {
    if (!Array.isArray(week.rows)) return

    week.rows.forEach(row => {
      const name = normalizeName(row.customerName)

      if (name) {
        names.add(name)
      }
    })
  })

  return Array.from(names)
}