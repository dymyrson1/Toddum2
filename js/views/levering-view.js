import {
  buildLeveringDataFromState,
  getLeveringDeliveryDaysFromState,
  getLeveringWeekLabelFromState
} from '../levering/levering-state.js'

import { attachLeveringEvents } from '../levering/levering-events.js'
import { renderLeveringLayout } from '../levering/levering-render.js'

let selectedDeliveryDay = 'Alle'

export function renderLeveringView(container) {
  const data = buildLeveringDataFromState()

  const result = renderLeveringLayout({
    data,
    weekLabel: getLeveringWeekLabelFromState(),
    deliveryDays: getLeveringDeliveryDaysFromState(),
    selectedDeliveryDay
  })

  selectedDeliveryDay = result.selectedDeliveryDay
  container.innerHTML = result.html

  attachLeveringEvents({
    container,
    onDeliveryDayChange: (deliveryDay) => {
      selectedDeliveryDay = deliveryDay
      renderLeveringView(container)
    },
    onDeliveryCheckChange: () => {
      renderLeveringView(container)
    }
  })
}
