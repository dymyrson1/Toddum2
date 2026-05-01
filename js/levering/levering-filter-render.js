import { escapeHtml } from '../utils/html.js'

export function renderDayFilter(filterItems, selectedDeliveryDay) {
  return `
    <div class="delivery-day-filter">
      ${filterItems.map((item) => renderDayFilterButton(item, selectedDeliveryDay)).join('')}
    </div>
  `
}

function renderDayFilterButton(item, selectedDeliveryDay) {
  return `
    <button
      type="button"
      class="delivery-day-filter-btn ${item.value === selectedDeliveryDay ? 'active' : ''}"
      data-delivery-day-filter="${escapeHtml(item.value)}"
    >
      <span>${escapeHtml(item.label)}</span>
      <strong>${item.count}</strong>
    </button>
  `
}
