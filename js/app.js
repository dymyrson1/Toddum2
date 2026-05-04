import { initState } from './state.js'
import { initTabs } from './tabs/tabs.js'
import { renderTab } from './tabs/tabs-render.js'
import { initWeekControls } from './week/week.js'
import { initContextMenu } from './table/context-menu.js'
import { initTableKeyboardEvents } from './table/table-events.js'
import { initTheme } from './app/theme.js'
import { initIcons } from './icons.js'

startApp()

async function startApp() {
  console.log('App starting...')

  await initState()

  initTabs()
  initWeekControls()
  initContextMenu()
  initTableKeyboardEvents()
  initTheme()
  initIcons()
  renderTab()

  console.log('✅ App ready')
}
