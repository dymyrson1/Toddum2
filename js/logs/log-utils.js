import { createLogId } from '../utils/id.js'

export function createLogEntry({ action, details = {}, weekId, weekLabel }) {
  return {
    id: createLogId(),
    createdAt: new Date().toISOString(),
    weekId,
    weekLabel,
    action,
    actionLabel: details.actionLabel || action,
    customerName: details.customerName || '',
    deliveryDay: details.deliveryDay || '',
    productName: details.productName || '',
    oldValue: details.oldValue || '',
    newValue: details.newValue || '',
    note: details.note || ''
  }
}