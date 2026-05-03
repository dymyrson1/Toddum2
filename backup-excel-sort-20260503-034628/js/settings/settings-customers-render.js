import { getCustomerName, state } from '../state.js'
import { escapeHtml } from '../utils/html.js'
import {
  getSettingsCustomerSortLabel,
  sortSettingsCustomers
} from './settings-customer-sort.js'

export function renderCustomersList() {
  const container = document.getElementById('customersList')
  if (!container) return

  if (state.customers.length === 0) {
    container.innerHTML = `
      <p class="settings-empty">Ingen kunder registrert.</p>
    `
    return
  }

  const customers = sortSettingsCustomers(state.customers)

  container.innerHTML = `
    <div class="settings-sort-toolbar">
      <button class="settings-sort-btn" type="button" data-settings-customer-sort="name">
        ${getSettingsCustomerSortLabel('name', 'Navn')}
      </button>

      <button class="settings-sort-btn" type="button" data-settings-customer-sort="contactPerson">
        ${getSettingsCustomerSortLabel('contactPerson', 'Kontaktperson')}
      </button>

      <button class="settings-sort-btn" type="button" data-settings-customer-sort="phone">
        ${getSettingsCustomerSortLabel('phone', 'Telefon')}
      </button>

      <button class="settings-sort-btn" type="button" data-settings-customer-sort="address">
        ${getSettingsCustomerSortLabel('address', 'Adresse')}
      </button>

      <button class="settings-sort-btn" type="button" data-settings-customer-sort="deliveryOrder">
        ${getSettingsCustomerSortLabel('deliveryOrder', 'Rekkefølge')}
      </button>
    </div>

    <div class="customer-admin-table-wrap">
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
    </div>
  `
}

export function getCustomerNameForConfirmation(customerId) {
  const customer = state.customers.find((item) => item.id === customerId)
  return getCustomerName(customer)
}

function renderCustomerRow(customer, index, customerCount) {
  return `
    <tr>
      <td>${index + 1}</td>

      <td>
        <input
          value="${escapeHtml(customer.name || '')}"
          data-customer-id="${customer.id}"
          data-customer-field="name"
        />
      </td>

      <td>
        <input
          value="${escapeHtml(customer.contactPerson || '')}"
          data-customer-id="${customer.id}"
          data-customer-field="contactPerson"
        />
      </td>

      <td>
        <input
          value="${escapeHtml(customer.phone || '')}"
          data-customer-id="${customer.id}"
          data-customer-field="phone"
        />
      </td>

      <td>
        <input
          value="${escapeHtml(customer.address || '')}"
          data-customer-id="${customer.id}"
          data-customer-field="address"
        />
      </td>

      <td class="customer-move-cell">
        <input
          value="${escapeHtml(customer.deliveryOrder || '')}"
          data-customer-id="${customer.id}"
          data-customer-field="deliveryOrder"
        />

        <button
          class="move-customer-btn"
          type="button"
          data-move-customer="${customer.id}"
          data-move-direction="up"
          ${index === 0 ? 'disabled' : ''}
          title="Flytt opp"
        >
          ↑
        </button>

        <button
          class="move-customer-btn"
          type="button"
          data-move-customer="${customer.id}"
          data-move-direction="down"
          ${index === customerCount - 1 ? 'disabled' : ''}
          title="Flytt ned"
        >
          ↓
        </button>
      </td>

      <td>
        <button type="button" data-remove-customer="${customer.id}">
          Slett
        </button>
      </td>
    </tr>
  `
}
