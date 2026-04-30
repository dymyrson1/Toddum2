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

  switch (state.activeTab) {
    case 'orders':
      renderOrdersView(container)
      break

    case 'rapport':
      renderRapportView(container)
      break

    case 'levering':
      renderLeveringView(container)
      break

    case 'analytics':
      renderAnalyticsView(container)
      break

    case 'logg':
      renderLoggView(container)
      break

    case 'loggDetaljert':
      renderLoggDetaljertView(container)
      break

    case 'settings':
      renderSettingsView(container)
      break

    default:
      state.activeTab = 'orders'
      renderOrdersView(container)
      break
  }
}
