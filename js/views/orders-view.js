import { renderOrdersTab } from '../table/table-render.js'

export function renderOrdersView(container) {
  container.innerHTML = `
    <section id="ordersTab" class="tab-panel">
      <div id="tableContainer"></div>
    </section>
  `

  renderOrdersTab()
}
