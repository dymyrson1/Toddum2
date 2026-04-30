import { attachSettingsEvents } from '../settings/settings-events.js'
import { renderSettingsLayout } from '../settings/settings-render.js'

export function renderSettingsView(container) {
  renderSettingsLayout(container)
  attachSettingsEvents(container)
}
