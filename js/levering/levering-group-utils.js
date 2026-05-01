import { sortDeliveriesByCustomerNumber } from './levering-customer-utils.js'

export function groupDeliveriesByDay(deliveries, deliveryDays) {
  const groups = new Map()

  deliveries.forEach((delivery) => {
    if (!groups.has(delivery.deliveryDay)) {
      groups.set(delivery.deliveryDay, [])
    }

    groups.get(delivery.deliveryDay).push(delivery)
  })

  return getDeliveryDayOrder(deliveryDays)
    .filter((day) => groups.has(day))
    .map((day) => ({
      day,
      deliveries: groups.get(day).sort(sortDeliveriesByCustomerNumber)
    }))
}

export function getDeliveryDayOrder(deliveryDays = []) {
  return [...deliveryDays, 'Uten leveringsdag']
}
