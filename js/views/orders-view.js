import { renderOrdersTab } from '../table/table-render.js'
import { initWeekControls } from '../week/week.js'

export function renderOrdersView(container) {
  container.innerHTML = `
    <section id="ordersTab" class="tab-panel">
      <div class="top-bar">
        <button id="prevWeek" class="week-btn">←</button>
        <div id="weekLabel" class="week-label"></div>
        <button id="nextWeek" class="week-btn">→</button>
      </div>

      <div id="tableContainer"></div>
    </section>
  `

  renderOrdersTab()
  initWeekControls()
}