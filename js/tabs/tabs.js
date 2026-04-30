import { state } from '../state.js'
import { renderTab } from './tabs-render.js'

export function initTabs() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab

      if (!tabName) return
      if (state.activeTab === tabName) return

      state.activeTab = tabName

      updateActiveTabButton(tabName)
      renderTab()
    })
  })

  updateActiveTabButton(state.activeTab || 'orders')
}

function updateActiveTabButton(activeTab) {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === activeTab)
  })
}
