import {
  findCustomerForRow,
  getDeliveryOrder,
  sortDeliveriesByCustomerNumber
} from './levering-customer-utils.js'

import { getDeliveryDayOrder, groupDeliveriesByDay } from './levering-group-utils.js'

import { getDeliveryItems, hasOrderContent } from './levering-item-utils.js'

export {
  findCustomerForRow,
  getDeliveryOrder,
  sortDeliveriesByCustomerNumber
} from './levering-customer-utils.js'

export { getDeliveryDayOrder, groupDeliveriesByDay } from './levering-group-utils.js'

export {
  formatDeliveryItem,
  getDeliveryItems,
  hasOrderContent
} from './levering-item-utils.js'

export function buildLeveringData({ rows = [], customers = [], deliveryDays = [] }) {
  const deliveries = rows
    .filter(hasOrderContent)
    .map((row) => {
      const customer = findCustomerForRow(customers, row.customerName)
      const deliveryDay = row.deliveryDay || 'Uten leveringsdag'

      return {
        rowId: row.id,
        deliveryOrder: getDeliveryOrder(customer),
        customerName: row.customerName || 'Uten kunde',
        address: customer?.address || '',
        phone: customer?.phone || '',
        contactPerson: customer?.contactPerson || '',
        deliveryDay,
        items: getDeliveryItems(row),
        packed: Boolean(row.checks?.A),
        delivered: Boolean(row.checks?.B)
      }
    })
    .sort(sortDeliveriesByCustomerNumber)

  return {
    deliveries,
    groups: groupDeliveriesByDay(deliveries, deliveryDays)
  }
}

export function getVisibleDeliveryGroups(groups, selectedDeliveryDay) {
  if (selectedDeliveryDay === 'Alle') {
    return groups
  }

  return groups.filter((group) => group.day === selectedDeliveryDay)
}

export function getDeliveryFilterItems(data, deliveryDays, selectedDeliveryDay) {
  const availableDays = new Set(data.groups.map((group) => group.day))

  const filterItems = [
    {
      label: 'Alle',
      value: 'Alle',
      count: data.deliveries.length
    },
    ...getDeliveryDayOrder(deliveryDays)
      .filter((day) => availableDays.has(day))
      .map((day) => ({
        label: day,
        value: day,
        count: data.groups.find((group) => group.day === day)?.deliveries.length || 0
      }))
  ]

  const safeSelectedDeliveryDay = filterItems.some((item) => {
    return item.value === selectedDeliveryDay
  })
    ? selectedDeliveryDay
    : 'Alle'

  return {
    filterItems,
    selectedDeliveryDay: safeSelectedDeliveryDay
  }
}
