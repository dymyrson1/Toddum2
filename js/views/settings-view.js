import {
  state,
  addCustomer,
  removeCustomer,
  addProduct,
  removeProduct,
  addProductPackagingType,
  removeProductPackagingType,
  getPackagingTypesForProduct
} from '../state.js'

import { renderTab } from '../tabs/tabs-render.js'

export function renderSettingsView(container) {
  const selectedProduct = state.products[0] || ''

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
          <h3>Упаковка по продуктах</h3>

          ${renderPackagingManager(selectedProduct)}
        </div>

        <div class="settings-card">
          <h3>Дні доставки</h3>

          <div class="settings-note">
            Дні доставки задані як константа норвезькою мовою.
          </div>

          <div class="settings-list">
            ${state.deliveryDays.map(day => `
              <div class="settings-item fixed-item">
                <span>${escapeHtml(day)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `

  renderCustomersList()
  renderProductsList()
  attachSettingsEvents()
}

function renderPackagingManager(selectedProduct) {
  if (state.products.length === 0) {
    return `
      <p class="muted-text">
        Спочатку додай хоча б один продукт.
      </p>
    `
  }

  return `
    <div class="settings-form">
      <select id="packagingProductSelect">
        ${state.products.map(product => `
          <option 
            value="${escapeHtml(product)}" 
            ${product === selectedProduct ? 'selected' : ''}
          >
            ${escapeHtml(product)}
          </option>
        `).join('')}
      </select>
    </div>

    <form id="packagingForm" class="settings-form">
      <input 
        id="packagingInput" 
        type="text" 
        placeholder="Наприклад: 250g або spann 3kg"
        autocomplete="off"
      >
      <button type="submit">Додати</button>
    </form>

    <div id="packagingList" class="settings-list"></div>
  `
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

function renderPackagingList(productName) {
  const list = document.getElementById('packagingList')
  if (!list || !productName) return

  const types = getPackagingTypesForProduct(productName)

  list.innerHTML = types.map(type => `
    <div class="settings-item">
      <span>${escapeHtml(type)}</span>
      ${
        type === 'kg'
          ? '<span class="fixed-label">standard</span>'
          : `<button data-remove-product-packaging="${escapeHtml(type)}">Видалити</button>`
      }
    </div>
  `).join('')
}

function attachSettingsEvents() {
  const customerForm = document.getElementById('customerForm')
  const productForm = document.getElementById('productForm')
  const packagingForm = document.getElementById('packagingForm')
  const packagingProductSelect = document.getElementById('packagingProductSelect')

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

  if (packagingProductSelect) {
    renderPackagingList(packagingProductSelect.value)

    packagingProductSelect.onchange = () => {
      renderPackagingList(packagingProductSelect.value)
      attachPackagingRemoveEvents(packagingProductSelect.value)
    }
  }

  if (packagingForm) {
    packagingForm.onsubmit = event => {
      event.preventDefault()

      const input = document.getElementById('packagingInput')
      const productName = packagingProductSelect.value

      const added = addProductPackagingType(productName, input.value)

      if (added) {
        input.value = ''
        renderPackagingList(productName)
        attachPackagingRemoveEvents(productName)
      }
    }
  }

  document.querySelectorAll('[data-remove-customer]').forEach(button => {
    button.onclick = () => {
      const name = button.dataset.removeCustomer
      const confirmed = confirm(`Видалити замовника "${name}" зі списку?`)

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

  if (packagingProductSelect) {
    attachPackagingRemoveEvents(packagingProductSelect.value)
  }
}

function attachPackagingRemoveEvents(productName) {
  document.querySelectorAll('[data-remove-product-packaging]').forEach(button => {
    button.onclick = () => {
      const typeName = button.dataset.removeProductPackaging
      const confirmed = confirm(`Видалити "${typeName}" для продукту "${productName}"?`)

      if (!confirmed) return

      const removed = removeProductPackagingType(productName, typeName)

      if (removed) {
        renderPackagingList(productName)
        attachPackagingRemoveEvents(productName)
      }
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