import { state } from '../state.js'
import { renderTab } from './tabs-render.js'

export function initTabs() {
  const tabs = document.querySelectorAll('.tab')

  tabs.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab
      if (!tabName) return

      state.currentTab = tabName

      updateActiveTabButton(tabName)
      renderTab()
    })
  })
}

function updateActiveTabButton(activeTab) {
  document.querySelectorAll('.tab').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === activeTab)
  })
}