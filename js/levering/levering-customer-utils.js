export function findCustomerForRow(customers, customerName) {
  const cleanRowName = normalizeText(customerName)

  if (!cleanRowName) return null

  return (
    customers.find((customer) => {
      return normalizeText(getCustomerNameValue(customer)) === cleanRowName
    }) || null
  )
}

export function getDeliveryOrder(customer) {
  const order = Number(customer?.deliveryOrder)

  if (!Number.isFinite(order) || order <= 0) {
    return null
  }

  return order
}

export function sortDeliveriesByCustomerNumber(a, b) {
  const orderA = a.deliveryOrder
  const orderB = b.deliveryOrder

  if (orderA !== null && orderB !== null && orderA !== orderB) {
    return orderA - orderB
  }

  if (orderA !== null && orderB === null) {
    return -1
  }

  if (orderA === null && orderB !== null) {
    return 1
  }

  return a.customerName.localeCompare(b.customerName)
}

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function getCustomerNameValue(customer) {
  if (typeof customer === 'string') return customer

  return customer?.name || ''
}
