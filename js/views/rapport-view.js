import { buildRapportDataFromState } from '../rapport/rapport-state.js'
import { renderRapportLayout } from '../rapport/rapport-render.js'
import {
  clearCustomerSearch,
  getCustomerSearch,
  normalizeSearchValue,
  setCustomerSearch
} from '../shared/customer-search.js'

export function renderRapportView(container) {
  const report = buildRapportDataFromState()
  const searchValue = getCustomerSearch('rapport')

  container.innerHTML = `
    <div class="rapport-search-panel">
      <div class="customer-search-box">
        <label for="rapportCustomerSearch">Søk kunde</label>

        <div class="customer-search-input-wrap">
          <input
            id="rapportCustomerSearch"
            class="customer-search-input"
            type="search"
            placeholder="Søk etter kundenavn..."
            value="${escapeHtml(searchValue)}"
            autocomplete="off"
          />

          <button
            id="clearRapportCustomerSearch"
            class="customer-search-clear"
            type="button"
            ${searchValue ? '' : 'disabled'}
          >
            Tøm
          </button>
        </div>
      </div>
    </div>

    ${renderRapportLayout(report)}
  `

  attachRapportCustomerSearch(container)
  applyRapportCustomerSearch(container)
}

function attachRapportCustomerSearch(container) {
  const input = container.querySelector('#rapportCustomerSearch')
  const clearButton = container.querySelector('#clearRapportCustomerSearch')

  if (input) {
    input.oninput = () => {
      setCustomerSearch('rapport', input.value)
      applyRapportCustomerSearch(container)

      if (clearButton) {
        clearButton.disabled = !input.value
      }
    }
  }

  if (clearButton) {
    clearButton.onclick = () => {
      clearCustomerSearch('rapport')

      const input = container.querySelector('#rapportCustomerSearch')
      if (input) {
        input.value = ''
        input.focus()
      }

      clearButton.disabled = true
      applyRapportCustomerSearch(container)
    }
  }
}

function applyRapportCustomerSearch(container) {
  const query = normalizeSearchValue(getCustomerSearch('rapport'))
  const rows = Array.from(container.querySelectorAll('tbody tr'))

  rows.forEach((row) => {
    if (!query) {
      row.hidden = false
      return
    }

    const firstCell = row.querySelector('td')
    const customerText = firstCell ? firstCell.textContent : row.textContent

    row.hidden = !normalizeSearchValue(customerText).includes(query)
  })
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
