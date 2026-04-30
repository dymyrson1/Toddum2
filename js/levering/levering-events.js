import { updateRowCheck } from '../state.js'

export function attachLeveringEvents({
  container,
  onDeliveryDayChange,
  onDeliveryCheckChange
}) {
  container.onclick = (event) => {
    const button = event.target.closest('[data-delivery-day-filter]')

    if (!button) return

    onDeliveryDayChange(button.dataset.deliveryDayFilter)
  }

  container.onchange = (event) => {
    const checkbox = event.target.closest('[data-delivery-row-id][data-delivery-check]')

    if (!checkbox) return

    updateRowCheck(
      checkbox.dataset.deliveryRowId,
      checkbox.dataset.deliveryCheck,
      checkbox.checked
    )

    onDeliveryCheckChange()
  }
}
