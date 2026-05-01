import { getCustomerName, state } from '../state.js'
import { escapeHtml } from '../utils/html.js'

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

export function getCustomerNameForConfirmation(customerId) {
  const customer = state.customers.find((item) => item.id === customerId)

  return getCustomerName(customer)
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
