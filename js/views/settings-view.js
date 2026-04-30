import {
  state,
  addCustomer,
  removeCustomer,
  addProduct,
  removeProduct,
  addPackagingType,
  removePackagingType
} from '../state.js'

import { renderTab } from '../tabs/tabs-render.js'

export function renderSettingsView(container) {
  container.innerHTML = `
    <section id="settingsTab" class="tab-panel">
      <h2>Settings</h2>

      <div class="settings-grid">
        <div class="settings-card">
          <h3>Замовники</h3>

          <form id="customerForm" class="settings-form">
            <input 
              id="customerInput" 
              type="text" 
              placeholder="Новий замовник"
              autocomplete="off"
            >
            <button type="submit">Додати</button>
          </form>

          <div id="customersList" class="settings-list"></div>
        </div>

        <div class="settings-card">
          <h3>Продукти</h3>

          <form id="productForm" class="settings-form">
            <input 
              id="productInput" 
              type="text" 
              placeholder="Новий продукт"
              autocomplete="off"
            >
            <button type="submit">Додати</button>
          </form>

          <div id="productsList" class="settings-list"></div>
        </div>

        <div class="settings-card">
          <h3>Типи упаковки</h3>

          <form id="packagingForm" class="settings-form">
            <input 
              id="packagingInput" 
              type="text" 
              placeholder="Новий тип упаковки"
              autocomplete="off"
            >
            <button type="submit">Додати</button>
          </form>

          <div id="packagingList" class="settings-list"></div>
        </div>
      </div>
    </section>
  `

  renderCustomersList()
  renderProductsList()
  renderPackagingList()
  attachSettingsEvents()
}

function renderCustomersList() {
  const list = document.getElementById('customersList')
  if (!list) return

  list.innerHTML = state.customers.map(customer => `
    <div class="settings-item">
      <span>${escapeHtml(customer)}</span>
      <button data-remove-customer="${escapeHtml(customer)}">Видалити</button>
    </div>
  `).join('')
}

function renderProductsList() {
  const list = document.getElementById('productsList')
  if (!list) return

  list.innerHTML = state.products.map(product => `
    <div class="settings-item">
      <span>${escapeHtml(product)}</span>
      <button data-remove-product="${escapeHtml(product)}">Видалити</button>
    </div>
  `).join('')
}

function renderPackagingList() {
  const list = document.getElementById('packagingList')
  if (!list) return

  list.innerHTML = state.packagingTypes.map(type => `
    <div class="settings-item">
      <span>${escapeHtml(type)}</span>
      <button data-remove-packaging="${escapeHtml(type)}">Видалити</button>
    </div>
  `).join('')
}

function attachSettingsEvents() {
  const customerForm = document.getElementById('customerForm')
  const productForm = document.getElementById('productForm')
  const packagingForm = document.getElementById('packagingForm')

  customerForm.onsubmit = event => {
    event.preventDefault()

    const input = document.getElementById('customerInput')
    const added = addCustomer(input.value)

    if (added) {
      input.value = ''
      renderTab()
    }
  }

  productForm.onsubmit = event => {
    event.preventDefault()

    const input = document.getElementById('productInput')
    const added = addProduct(input.value)

    if (added) {
      input.value = ''
      renderTab()
    }
  }

  packagingForm.onsubmit = event => {
    event.preventDefault()

    const input = document.getElementById('packagingInput')
    const added = addPackagingType(input.value)

    if (added) {
      input.value = ''
      renderTab()
    }
  }

  document.querySelectorAll('[data-remove-customer]').forEach(button => {
    button.onclick = () => {
      const name = button.dataset.removeCustomer
      const confirmed = confirm(`Видалити замовника "${name}" і всі його дані?`)

      if (!confirmed) return

      removeCustomer(name)
      renderTab()
    }
  })

  document.querySelectorAll('[data-remove-product]').forEach(button => {
    button.onclick = () => {
      const name = button.dataset.removeProduct
      const confirmed = confirm(`Видалити продукт "${name}" і всі його дані?`)

      if (!confirmed) return

      removeProduct(name)
      renderTab()
    }
  })

  document.querySelectorAll('[data-remove-packaging]').forEach(button => {
    button.onclick = () => {
      const name = button.dataset.removePackaging
      const confirmed = confirm(`Видалити тип упаковки "${name}" з усіх замовлень?`)

      if (!confirmed) return

      removePackagingType(name)
      renderTab()
    }
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}