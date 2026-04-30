import { normalizeLooseText, normalizeName } from '../utils/text.js'

export function normalizeCustomers(customers) {
  if (!Array.isArray(customers)) return []

  const normalized = customers
    .map((customer) => normalizeCustomer(customer))
    .filter((customer) => customer.name)

  normalized.sort((a, b) => {
    const orderA = Number(a.deliveryOrder) || 0
    const orderB = Number(b.deliveryOrder) || 0

    if (orderA !== orderB) {
      if (orderA === 0) return 1
      if (orderB === 0) return -1

      return orderA - orderB
    }

    return a.name.localeCompare(b.name)
  })

  return normalized.map((customer, index) => ({
    ...customer,
    deliveryOrder: index + 1
  }))
}

export function normalizeCustomer(customer) {
  if (typeof customer === 'string') {
    const name = normalizeName(customer)

    return {
      id: createCustomerId(name),
      name,
      contactPerson: '',
      phone: '',
      address: '',
      deliveryOrder: 0
    }
  }

  const name = normalizeName(customer?.name)

  return {
    id: customer?.id || createCustomerId(name),
    name,
    contactPerson: normalizeName(customer?.contactPerson),
    phone: normalizeName(customer?.phone),
    address: normalizeName(customer?.address),
    deliveryOrder: normalizeDeliveryOrder(customer?.deliveryOrder)
  }
}

export function normalizeCustomerPatch(patch) {
  const result = {}

  if (patch.name !== undefined) {
    result.name = normalizeName(patch.name)
  }

  if (patch.contactPerson !== undefined) {
    result.contactPerson = normalizeName(patch.contactPerson)
  }

  if (patch.phone !== undefined) {
    result.phone = normalizeName(patch.phone)
  }

  if (patch.address !== undefined) {
    result.address = normalizeName(patch.address)
  }

  if (patch.deliveryOrder !== undefined) {
    result.deliveryOrder = normalizeDeliveryOrder(patch.deliveryOrder)
  }

  return result
}

export function normalizeDeliveryOrder(value) {
  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    return 0
  }

  return Math.round(number)
}

export function createCustomerId(name) {
  return `customer_${normalizeLooseText(name)}`
}

export function formatCustomerForLog(customer) {
  if (!customer) return ''

  return [
    customer.name,
    customer.contactPerson,
    customer.phone,
    customer.address,
    customer.deliveryOrder ? `Nr. ${customer.deliveryOrder}` : ''
  ]
    .filter(Boolean)
    .join(' / ')
}
