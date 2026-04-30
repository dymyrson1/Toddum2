import {
  state,
  addCustomer,
  removeCustomer,
  addProduct,
  removeProduct,
  addProductPackagingOption,
  removeProductPackagingOption,
  getPackagingOptionsForProduct
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

    <form id="packagingForm" class="settings-form packaging-add-form">
      <input
        id="packagingNameInput"
        type="text"
        placeholder="Назва упаковки, напр. spann або 250g"
        autocomplete="off"
      >

      <input
        id="packagingWeightInput"
        type="number"
        placeholder="Вага в кг, напр. 3 або 0.125"
        step="any"
        min="0"
      >

      <button type="submit">Додати</button>
    </form>

    <div class="settings-note">
      Для кожного продукту автоматично існує стандартний варіант <strong>kg</strong>.
    </div>

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

  const options = getPackagingOptionsForProduct(productName)

  list.innerHTML = options.map(option => `
    <div class="settings-item">
      <div class="packaging-item-main">
        <strong>${escapeHtml(option.label)}</strong>
        ${
          option.isDefault
            ? '<div class="packaging-item-sub">standard</div>'
            : `<div class="packaging-item-sub">Navn: ${escapeHtml(option.packageName)} · Vekt: ${escapeHtml(formatWeightForUi(option.weightKg))}</div>`
        }
      </div>

      ${
        option.isDefault
          ? '<span class="fixed-label">standard</span>'
          : `<button data-remove-product-packaging="${escapeHtml(option.id)}">Видалити</button>`
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

  if (packagingForm && packagingProductSelect) {
    packagingForm.onsubmit = event => {
      event.preventDefault()

      const productName = packagingProductSelect.value
      const packagingNameInput = document.getElementById('packagingNameInput')
      const packagingWeightInput = document.getElementById('packagingWeightInput')

      const added = addProductPackagingOption(
        productName,
        packagingNameInput.value,
        packagingWeightInput.value
      )

      if (added) {
        packagingNameInput.value = ''
        packagingWeightInput.value = ''
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
      const optionId = button.dataset.removeProductPackaging
      const confirmed = confirm(`Видалити цей тип упаковки для продукту "${productName}"?`)

      if (!confirmed) return

      const removed = removeProductPackagingOption(productName, optionId)

      if (removed) {
        renderPackagingList(productName)
        attachPackagingRemoveEvents(productName)
      }
    }
  })
}

function formatWeightForUi(weightKg) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return '—'
  }

  const grams = Math.round(weightKg * 1000)

  if (grams < 1000) {
    return `${grams} g`
  }

  if (grams % 1000 === 0) {
    return `${grams / 1000} kg`
  }

  return `${String((grams / 1000).toFixed(2)).replace(/\.?0+$/, '')} kg`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}