import { buildRapportDataFromState } from '../rapport/rapport-state.js'
import { renderRapportLayout } from '../rapport/rapport-render.js'

export function renderRapportView(container) {
  const report = buildRapportDataFromState()

  container.innerHTML = renderRapportLayout(report)
}
