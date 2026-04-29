import { state } from '../state.js'
import { renderOrdersView } from '../views/orders-view.js'
import { renderAnalyticsView } from '../views/analytics-view.js'
import { renderSettingsView } from '../views/settings-view.js'

export function renderTab() {
  const container = document.getElementById('tabContent')
  if (!container) return

  if (state.currentTab === 'orders') {
    renderOrdersView(container)
    return
  }

  if (state.currentTab === 'analytics') {
    renderAnalyticsView(container)
    return
  }

  if (state.currentTab === 'settings') {
    renderSettingsView(container)
    return
  }

  renderOrdersView(container)
}