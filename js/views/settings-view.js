import {
  state,
  addCustomer,
  updateCustomer,
  moveCustomer,
  removeCustomer,
  addProduct,
  removeProduct,
  moveProduct,
  addProductPackagingOption,
  removeProductPackagingOption,
  getPackagingOptionsForProduct
} from '../state.js'

import { renderTab } from '../tabs/tabs-render.js'

export function renderSettingsView(container) {
  const selectedProduct = state.products[0] || ''

  container.innerHTML = `
    <section id="settingsTab" class="tab-panel settings-panel">
      <div class="settings-header">
        <div>
          <h2>Innstillinger</h2>
          <p>Administrer kunder, produkter og emballasje.</p>
        </div>
      </div>

      <div class="settings-layout">
        <section class="settings-section settings-section-wide">
          <div class="settings-section-header">
            <h3>Kunder</h3>
            <span>${state.customers.length} registrert</span>
          </div>

          <form id="customerForm" class="customer-form-pro">
            <label>
              Navn
              <input
                id="customerNameInput"
                type="text"
                placeholder="Kundenavn"
                autocomplete="off"
              >
            </label>

            <label>
              Kontaktperson
              <input
                id="customerContactInput"
                type="text"
                placeholder="Kontaktperson"
                autocomplete="off"
              >
            </label>

            <label>
              Telefon
              <input
                id="customerPhoneInput"
                type="text"
                placeholder="Telefon"
                autocomplete="off"
              >
            </label>

            <label>
              Adresse
              <input
                id="customerAddressInput"
                type="text"
                placeholder="Adresse"
                autocomplete="off"
              >
            </label>

            <label>
              Leveringsnr.
              <input
                id="customerDeliveryOrderInput"
                type="number"
                placeholder="Auto"
                min="0"
                step="1"
              >
            </label>

            <button type="submit">Legg til</button>
          </form>

          <div id="customersList" class="customer-admin-table-wrap"></div>
        </section>

        <div class="settings-products-layout settings-section-wide">
          <section class="settings-section">
            <div class="settings-section-header">
              <h3>Produkter</h3>
              <span>${state.products.length} registrert</span>
            </div>

            <form id="productForm" class="settings-inline-form">
              <input
                id="productInput"
                type="text"
                placeholder="Nytt produkt"
                autocomplete="off"
              >
              <button type="submit">Legg til</button>
            </form>

            <div id="productsList" class="settings-compact-list"></div>
          </section>

          <section class="settings-section">
            <div class="settings-section-header">
              <h3>Emballasje per produkt</h3>
              <span>Standard: kg</span>
            </div>

            ${renderPackagingManager(selectedProduct)}
          </section>
        </div>

        <section class="settings-section">
          <div class="settings-section-header">
            <h3>Leveringsdager</h3>
            <span>Fast liste</span>
          </div>

          <div class="settings-note">
            Leveringsdager er faste og brukes i bestillingstabellen.
          </div>

          <div class="settings-day-list">
            ${state.deliveryDays.map(day => `
              <span>${escapeHtml(day)}</span>
            `).join('')}
          </div>
        </section>
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
      <div class="settings-empty">
        Legg til et produkt først.
      </div>
    `
  }

  return `
    <div class="packaging-control-bar">
      <label>
        Produkt
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
      </label>
    </div>

    <form id="packagingForm" class="packaging-form-pro">
      <label>
        Emballasje
        <input
          id="packagingNameInput"
          type="text"
          placeholder="f.eks. spann eller 250g"
          autocomplete="off"
        >
      </label>

      <label>
        Vekt i kg
        <input
          id="packagingWeightInput"
          type="number"
          placeholder="f.eks. 3 eller 0.125"
          step="any"
          min="0"
        >
      </label>

      <button type="submit">Legg til</button>
    </form>

    <div id="packagingList" class="packaging-options-list"></div>
  `
}

function renderCustomersList() {
  const container = document.getElementById('customersList')
  if (!container) return

  if (state.customers.length === 0) {
    container.innerHTML = `<div class="settings-empty">Ingen kunder registrert.</div>`
    return
  }

  const customers = [...state.customers].sort((a, b) => {
    return a.deliveryOrder - b.deliveryOrder || a.name.localeCompare(b.name)
  })

  container.innerHTML = `
    <table class="customer-admin-table">
      <thead>
        <tr>
          <th>Nr.</th>
          <th>Navn</th>
          <th>Kontaktperson</th>
          <th>Telefon</th>
          <th>Adresse</th>
          <th>Rekkefølge</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        ${customers.map((customer, index) => `
          <tr>
            <td>
              <input
                type="number"
                min="1"
                step="1"
                value="${escapeHtml(customer.deliveryOrder)}"
                data-customer-id="${escapeHtml(customer.id)}"
                data-customer-field="deliveryOrder"
              >
            </td>

            <td>
              <input
                type="text"
                value="${escapeHtml(customer.name)}"
                data-customer-id="${escapeHtml(customer.id)}"
                data-customer-field="name"
              >
            </td>

            <td>
              <input
                type="text"
                value="${escapeHtml(customer.contactPerson)}"
                data-customer-id="${escapeHtml(customer.id)}"
                data-customer-field="contactPerson"
              >
            </td>

            <td>
              <input
                type="text"
                value="${escapeHtml(customer.phone)}"
                data-customer-id="${escapeHtml(customer.id)}"
                data-customer-field="phone"
              >
            </td>

            <td>
              <input
                type="text"
                value="${escapeHtml(customer.address)}"
                data-customer-id="${escapeHtml(customer.id)}"
                data-customer-field="address"
              >
            </td>

            <td class="customer-move-cell">
              <button
                class="move-customer-btn"
                data-move-customer="${escapeHtml(customer.id)}"
                data-move-direction="up"
                ${index === 0 ? 'disabled' : ''}
                title="Flytt opp"
              >
                ↑
              </button>

              <button
                class="move-customer-btn"
                data-move-customer="${escapeHtml(customer.id)}"
                data-move-direction="down"
                ${index === customers.length - 1 ? 'disabled' : ''}
                title="Flytt ned"
              >
                ↓
              </button>
            </td>

            <td>
              <button data-remove-customer="${escapeHtml(customer.id)}">Slett</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  attachCustomerFieldEvents()
  attachCustomerMoveEvents()
  attachCustomerRemoveEvents()
}

function renderProductsList() {
  const list = document.getElementById('productsList')
  if (!list) return

  if (state.products.length === 0) {
    list.innerHTML = `<div class="settings-empty">Ingen produkter registrert.</div>`
    return
  }

  list.innerHTML = `
    <div class="products-admin-table">
      <div class="products-admin-head">
        <span>Nr.</span>
        <span>Produkt</span>
        <span>Rekkefølge</span>
        <span></span>
      </div>

      ${state.products.map((product, index) => `
        <div class="products-admin-row">
          <span class="products-admin-number">${index + 1}</span>

          <strong>${escapeHtml(product)}</strong>

          <span class="products-admin-actions">
            <button
              class="move-product-btn"
              data-move-product="${escapeHtml(product)}"
              data-move-direction="up"
              ${index === 0 ? 'disabled' : ''}
              title="Flytt opp"
            >
              ↑
            </button>

            <button
              class="move-product-btn"
              data-move-product="${escapeHtml(product)}"
              data-move-direction="down"
              ${index === state.products.length - 1 ? 'disabled' : ''}
              title="Flytt ned"
            >
              ↓
            </button>
          </span>

          <button data-remove-product="${escapeHtml(product)}">
            Slett
          </button>
        </div>
      `).join('')}
    </div>
  `

  attachProductEvents()
  attachProductMoveEvents()
}

function renderPackagingList(productName) {
  const list = document.getElementById('packagingList')
  if (!list || !productName) return

  const options = getPackagingOptionsForProduct(productName)

  list.innerHTML = `
    <div class="packaging-options-table">
      <div class="packaging-options-head">
        <span>Emballasje</span>
        <span>Vekt</span>
        <span></span>
      </div>

      ${options.map(option => `
        <div class="packaging-options-row">
          <span>
            <strong>${escapeHtml(option.label)}</strong>
            ${option.isDefault ? '<small>Standard</small>' : ''}
          </span>

          <span>${escapeHtml(formatWeightForUi(option.weightKg))}</span>

          <span>
            ${
              option.isDefault
                ? '<em>Fast</em>'
                : `<button data-remove-product-packaging="${escapeHtml(option.id)}">Slett</button>`
            }
          </span>
        </div>
      `).join('')}
    </div>
  `
}

function attachSettingsEvents() {
  const customerForm = document.getElementById('customerForm')
  const productForm = document.getElementById('productForm')
  const packagingForm = document.getElementById('packagingForm')
  const packagingProductSelect = document.getElementById('packagingProductSelect')

  customerForm.onsubmit = event => {
    event.preventDefault()

    const added = addCustomer({
      name: document.getElementById('customerNameInput').value,
      contactPerson: document.getElementById('customerContactInput').value,
      phone: document.getElementById('customerPhoneInput').value,
      address: document.getElementById('customerAddressInput').value,
      deliveryOrder: document.getElementById('customerDeliveryOrderInput').value
    })

    if (added) {
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

  attachProductEvents()

  if (packagingProductSelect) {
    attachPackagingRemoveEvents(packagingProductSelect.value)
  }
}

function attachCustomerFieldEvents() {
  document.querySelectorAll('[data-customer-field]').forEach(input => {
    input.addEventListener('change', () => {
      updateCustomer(input.dataset.customerId, {
        [input.dataset.customerField]: input.value
      })

      renderCustomersList()
    })
  })
}

function attachCustomerMoveEvents() {
  document.querySelectorAll('[data-move-customer]').forEach(button => {
    button.onclick = () => {
      const moved = moveCustomer(
        button.dataset.moveCustomer,
        button.dataset.moveDirection
      )

      if (moved) {
        renderCustomersList()
      }
    }
  })
}

function attachCustomerRemoveEvents() {
  document.querySelectorAll('[data-remove-customer]').forEach(button => {
    button.onclick = () => {
      const customerId = button.dataset.removeCustomer
      const customer = state.customers.find(item => item.id === customerId)
      const confirmed = confirm(`Vil du slette kunden "${customer?.name || ''}" fra listen?`)

      if (!confirmed) return

      removeCustomer(customerId)
      renderTab()
    }
  })
}

function attachProductEvents() {
  document.querySelectorAll('[data-remove-product]').forEach(button => {
    button.onclick = () => {
      const name = button.dataset.removeProduct
      const confirmed = confirm(`Vil du slette produktet "${name}" og alle tilhørende data?`)

      if (!confirmed) return

      removeProduct(name)
      renderTab()
    }
  })
}

function attachProductMoveEvents() {
  document.querySelectorAll('[data-move-product]').forEach(button => {
    button.onclick = () => {
      const moved = moveProduct(
        button.dataset.moveProduct,
        button.dataset.moveDirection
      )

      if (moved) {
        renderTab()
      }
    }
  })
}

function attachPackagingRemoveEvents(productName) {
  document.querySelectorAll('[data-remove-product-packaging]').forEach(button => {
    button.onclick = () => {
      const optionId = button.dataset.removeProductPackaging
      const confirmed = confirm(`Vil du slette denne emballasjen for produktet "${productName}"?`)

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