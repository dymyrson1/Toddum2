import { getCurrentRows, getCurrentWeekLabel, state } from '../state.js'
import { buildRapportData } from './rapport-data.js'

export function buildRapportDataFromState() {
  return buildRapportData({
    rows: getCurrentRows(),
    products: state.products,
    weekLabel: getCurrentWeekLabel()
  })
}
