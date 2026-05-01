import { escapeHtml } from '../utils/html.js'
import { formatKg } from './analytics-formatters.js'
import { renderKpiGrid } from './analytics-kpi-render.js'
import { renderProgressSection } from './analytics-progress-render.js'

import {
  renderDeliveryDaySection,
  renderProblemsSection,
  renderTopCustomersSection,
  renderTopProductsSection
} from './analytics-sections-render.js'

export function renderAnalyticsLayout(data) {
  return `
    <section id="analyticsTab" class="tab-panel analytics-view">
      <div class="analytics-hero">
        <div>
          <h2>Analytics</h2>
          <p>${escapeHtml(data.weekLabel)}</p>
        </div>

        <div class="analytics-main-number">
          <span>Total vekt</span>
          <strong>${formatKg(data.totalWeightKg)}</strong>
        </div>
      </div>

      ${renderKpiGrid(data)}
      ${renderProgressSection(data)}

      <div class="analytics-layout">
        ${renderDeliveryDaySection(data)}
        ${renderTopCustomersSection(data)}
      </div>

      <div class="analytics-layout">
        ${renderTopProductsSection(data)}
        ${renderProblemsSection(data)}
      </div>
    </section>
  `
}
