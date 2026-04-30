import { DELIVERY_DAYS } from './constants.js'

export const state = {
  currentTab: 'orders',
  currentDate: new Date(),
  currentYear: null,
  currentWeek: null,
  selectedCell: null,
  customers: [],
  products: [],
  productPackagingTypes: {},
  deliveryDays: DELIVERY_DAYS,
  weeks: {},
  logs: []
}
