import { initState } from './state.js'
import { initTabs } from './tabs/tabs.js'
import { renderTab } from './tabs/tabs-render.js'
import { initContextMenu } from './table/context-menu.js'
import { initTableKeyboardEvents } from './table/table-events.js'

startApp()

async function startApp() {
  console.log('🚀 App starting...')

  await initState()

  initTabs()
  initContextMenu()
  initTableKeyboardEvents()
  initTheme()
  renderTab()

  console.log('✅ App ready')
}

function initTheme() {
  const autoTheme = getThemeByTime()
  applyTheme(autoTheme)

  const btn = document.getElementById('themeToggle')
  if (!btn) return

  btn.onclick = () => {
    const current = document.documentElement.dataset.theme
    const next = current === 'dark' ? 'light' : 'dark'

    applyTheme(next)
  }
}

function getThemeByTime() {
  const hour = new Date().getHours()

  if (hour >= 20 || hour < 7) {
    return 'dark'
  }

  return 'light'
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme

  const btn = document.getElementById('themeToggle')
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙'
  }
}