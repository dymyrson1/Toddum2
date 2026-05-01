import { renderRapportDetailTable } from './rapport-detail-render.js'
import { renderRapportHeader, renderRapportKpis } from './rapport-header-render.js'
import { renderRapportMain } from './rapport-summary-render.js'

export function renderRapportLayout(report) {
  return `
    <section id="rapportTab" class="tab-panel rapport-view">
      ${renderRapportHeader(report)}
      ${renderRapportKpis(report)}
      ${renderRapportMain(report)}
      ${renderRapportDetailTable(report)}
    </section>
  `
}
