import { getCurrentRows, getCurrentWeekLabel, state } from '../state.js'
import { buildLeveringData } from './levering-data.js'

export function buildLeveringDataFromState() {
  return buildLeveringData({
    rows: getCurrentRows(),
    customers: state.customers,
    deliveryDays: state.deliveryDays
  })
}

export function getLeveringWeekLabelFromState() {
  return getCurrentWeekLabel()
}

export function getLeveringDeliveryDaysFromState() {
  return state.deliveryDays
}
