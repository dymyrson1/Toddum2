import { initState } from './state.js'
import { initTabs } from './tabs/tabs.js'
import { renderTab } from './tabs/tabs-render.js'
import { initContextMenu } from './table/context-menu.js'
import { initTableKeyboardEvents } from './table/table-events.js'

initState()
initTabs()
initContextMenu()
initTableKeyboardEvents()
renderTab()