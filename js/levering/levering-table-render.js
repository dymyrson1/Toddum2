import { escapeHtml } from '../utils/html.js'

export function renderDeliveryGroups(groups, selectedDeliveryDay) {
  if (groups.length === 0) {
    return `
      <section class="delivery-card">
        <div class="delivery-empty">
          Ingen leveranser for valgt dag.
        </div>
      </section>
    `
  }

  if (selectedDeliveryDay === 'Alle') {
    return `
      <div class="delivery-groups">
        ${groups.map(renderDeliveryGroup).join('')}
      </div>
    `
  }

  return renderDeliveryTable(groups[0].deliveries)
}

function renderDeliveryGroup(group) {
  return `
    <section class="delivery-card">
      <div class="delivery-card-header">
        <h3>${escapeHtml(group.day)}</h3>
        <span>${group.deliveries.length} leveranser</span>
      </div>

      ${renderDeliveryTable(group.deliveries)}
    </section>
  `
}

function renderDeliveryTable(deliveries) {
  return `
    <div class="delivery-table-wrap">
      <table class="delivery-table">
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Kunde</th>
            <th>Varer</th>
            <th>Pakket</th>
            <th>Levert</th>
            <th>Adresse</th>
            <th>Telefon</th>
          </tr>
        </thead>

        <tbody>
          ${deliveries.map(renderDeliveryRow).join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderDeliveryRow(delivery) {
  return `
    <tr class="${getDeliveryRowClass(delivery)}">
      <td>${delivery.deliveryOrder === null ? '—' : escapeHtml(delivery.deliveryOrder)}</td>

      <td>
        <strong>${escapeHtml(delivery.customerName)}</strong>
        ${
          delivery.contactPerson
            ? `<small>${escapeHtml(delivery.contactPerson)}</small>`
            : ''
        }
      </td>

      <td>${renderDeliveryItems(delivery.items)}</td>

      <td>
        <input
          type="checkbox"
          data-delivery-row-id="${escapeHtml(delivery.rowId)}"
          data-delivery-check="A"
          ${delivery.packed ? 'checked' : ''}
        >
      </td>

      <td>
        <input
          type="checkbox"
          data-delivery-row-id="${escapeHtml(delivery.rowId)}"
          data-delivery-check="B"
          ${delivery.delivered ? 'checked' : ''}
        >
      </td>

      <td>${renderAddressLink(delivery.address)}</td>
      <td>${escapeHtml(delivery.phone || '—')}</td>
    </tr>
  `
}

function renderDeliveryItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '—'
  }

  return `
    <div class="delivery-items">
      ${items
        .map(
          (item) => `
            <div>
              <strong>${escapeHtml(item.productName)}:</strong>
              <span>${escapeHtml(item.itemText)}</span>
            </div>
          `
        )
        .join('')}
    </div>
  `
}

function renderAddressLink(address) {
  const cleanAddress = String(address || '').trim()

  if (!cleanAddress) {
    return '—'
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    cleanAddress
  )}`

  return `
    <a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">
      ${escapeHtml(cleanAddress)}
    </a>
  `
}

function getDeliveryRowClass(delivery) {
  if (delivery.packed && delivery.delivered) {
    return 'delivery-row-done'
  }

  if (delivery.packed) {
    return 'delivery-row-packed'
  }

  if (delivery.delivered) {
    return 'delivery-row-done'
  }

  return ''
}
