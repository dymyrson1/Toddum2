import { buildAnalyticsDataFromState } from '../analytics/analytics-state.js'
import { renderAnalyticsLayout } from '../analytics/analytics-render.js'

export function renderAnalyticsView(container) {
  const analytics = buildAnalyticsDataFromState()

  container.innerHTML = renderAnalyticsLayout(analytics)
}
