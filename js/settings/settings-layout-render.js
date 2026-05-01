import { state } from '../state.js'
import { escapeHtml } from '../utils/html.js'
import { renderCustomersList } from './settings-customers-render.js'
import { renderPackagingList } from './settings-packaging-render.js'
import { renderProductsList } from './settings-products-render.js'

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
