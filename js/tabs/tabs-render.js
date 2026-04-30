import { state } from '../state.js'
import { renderOrdersView } from '../views/orders-view.js'
import { renderRapportView } from '../views/rapport-view.js'
import { renderLeveringView } from '../views/levering-view.js'
import { renderAnalyticsView } from '../views/analytics-view.js'
import { renderLoggView } from '../views/logg-view.js'
import { renderLoggDetaljertView } from '../views/logg-detaljert-view.js'
import { renderSettingsView } from '../views/settings-view.js'

export function renderTab() {
  const container = document.getElementById('tabContent')
  if (!container) return

  if (state.currentTab === 'orders') {
    renderOrdersView(container)
    return
  }

  if (state.currentTab === 'rapport') {
    renderRapportView(container)
    return
  }

  if (state.currentTab === 'levering') {
    renderLeveringView(container)
    return
  }

  if (state.currentTab === 'analytics') {
    renderAnalyticsView(container)
    return
  }

  if (state.currentTab === 'logg') {
    renderLoggView(container)
    return
  }

  if (state.currentTab === 'loggDetaljert') {
    renderLoggDetaljertView(container)
    return
  }

  if (state.currentTab === 'settings') {
    renderSettingsView(container)
    return
  }

  renderOrdersView(container)
}