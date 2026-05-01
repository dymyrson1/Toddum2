import { getDeliveryFilterItems, getVisibleDeliveryGroups } from './levering-data.js'

import { renderDayFilter } from './levering-filter-render.js'
import { renderDeliveryGroups } from './levering-table-render.js'
import { escapeHtml } from '../utils/html.js'

export function renderLeveringLayout({
  data,
  weekLabel,
  deliveryDays,
  selectedDeliveryDay
}) {
  const filterData = getDeliveryFilterItems(data, deliveryDays, selectedDeliveryDay)
  const visibleGroups = getVisibleDeliveryGroups(
    data.groups,
    filterData.selectedDeliveryDay
  )

  return {
    selectedDeliveryDay: filterData.selectedDeliveryDay,
    html: `
      <section id="leveringTab" class="tab-panel levering-view">
        <div class="levering-hero">
          <div>
            <h2>Levering</h2>
            <p>${escapeHtml(weekLabel)}</p>
          </div>

          <div class="levering-main-number">
            <span>Leveranser</span>
            <strong>${data.deliveries.length}</strong>
          </div>
        </div>

        ${renderDayFilter(filterData.filterItems, filterData.selectedDeliveryDay)}
        ${renderDeliveryGroups(visibleGroups, filterData.selectedDeliveryDay)}
      </section>
    `
  }
}
