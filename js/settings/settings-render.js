import { getCustomerName, getPackagingOptionsForProduct, state } from '../state.js'

import { escapeHtml } from '../utils/html.js'
import { formatWeightForUi } from './settings-formatters.js'

export function renderSettingsLayout(container) {
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

          ${renderCustomerForm()}

          <div id="customersList" class="customer-admin-table-wrap"></div>
        </section>

        <div class="settings-products-layout settings-section-wide">
          <section class="settings-section">
            <div class="settings-section-header">
              <h3>Produkter</h3>
              <span>${state.products.length} registrert</span>
            </div>

            ${renderProductForm()}

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

        ${renderDeliveryDaysSection()}
      </div>
    </section>
  `

  renderCustomersList()
  renderProductsList()

  if (selectedProduct) {
    renderPackagingList(selectedProduct)
  }
}

function renderCustomerForm() {
  return `
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
  `
}

function renderProductForm() {
  return `
    <form id="productForm" class="settings-inline-form">
      <input
        id="productInput"
        type="text"
        placeholder="Nytt produkt"
        autocomplete="off"
      >
      <button type="submit">Legg til</button>
    </form>
  `
}

function renderDeliveryDaysSection() {
  return `
    <section class="settings-section">
      <div class="settings-section-header">
        <h3>Leveringsdager</h3>
        <span>Fast liste</span>
      </div>

      <div class="settings-note">
        Leveringsdager er faste og brukes i bestillingstabellen.
      </div>

      <div class="settings-day-list">
        ${state.deliveryDays.map((day) => `<span>${escapeHtml(day)}</span>`).join('')}
      </div>
    </section>
  `
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
          ${state.products
            .map(
              (product) => `
                <option
                  value="${escapeHtml(product)}"
                  ${product === selectedProduct ? 'selected' : ''}
                >
                  ${escapeHtml(product)}
                </option>
              `
            )
            .join('')}
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

export function renderCustomersList() {
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
        ${customers.map((customer, index) => renderCustomerRow(customer, index, customers.length)).join('')}
      </tbody>
    </table>
  `
}

function renderCustomerRow(customer, index, customerCount) {
  return `
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
          type="button"
        >
          ↑
        </button>

        <button
          class="move-customer-btn"
          data-move-customer="${escapeHtml(customer.id)}"
          data-move-direction="down"
          ${index === customerCount - 1 ? 'disabled' : ''}
          title="Flytt ned"
          type="button"
        >
          ↓
        </button>
      </td>

      <td>
        <button
          data-remove-customer="${escapeHtml(customer.id)}"
          type="button"
        >
          Slett
        </button>
      </td>
    </tr>
  `
}

export function renderProductsList() {
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

      ${state.products.map((product, index) => renderProductRow(product, index)).join('')}
    </div>
  `
}

function renderProductRow(product, index) {
  return `
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
          type="button"
        >
          ↑
        </button>

        <button
          class="move-product-btn"
          data-move-product="${escapeHtml(product)}"
          data-move-direction="down"
          ${index === state.products.length - 1 ? 'disabled' : ''}
          title="Flytt ned"
          type="button"
        >
          ↓
        </button>
      </span>

      <button
        data-remove-product="${escapeHtml(product)}"
        type="button"
      >
        Slett
      </button>
    </div>
  `
}

export function renderPackagingList(productName) {
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

      ${options.map((option) => renderPackagingRow(option)).join('')}
    </div>
  `
}

function renderPackagingRow(option) {
  return `
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
            : `
              <button
                data-remove-product-packaging="${escapeHtml(option.id)}"
                type="button"
              >
                Slett
              </button>
            `
        }
      </span>
    </div>
  `
}

export function getCustomerNameForConfirmation(customerId) {
  const customer = state.customers.find((item) => item.id === customerId)

  return getCustomerName(customer)
}
