import { getCurrentRows, getCurrentWeekLabel, state } from '../state.js'
import { buildAnalyticsData } from './analytics-data.js'

export function buildAnalyticsDataFromState() {
  return buildAnalyticsData({
    rows: getCurrentRows(),
    products: state.products,
    deliveryDays: state.deliveryDays,
    weekLabel: getCurrentWeekLabel()
  })
}
