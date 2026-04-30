import { updateOrderCell } from '../state.js'
import { renderTable } from '../table/table-render.js'
import { closeModal } from './modal-utils.js'

import {
  createProductModalItem,
  getFirstAvailableOption,
  readProductModalItems,
  removeProductModalItem,
  updateProductModalItemOption,
  updateProductModalItemQty
} from './product-modal-data.js'

export function attachProductModalEvents({
  modal,
  rowId,
  productName,
  items,
  options,
  render
}) {
  attachCloseEvents(modal)
  attachAddEvent({ items, options, render })
  attachSaveEvent({ rowId, productName, items, options })
  attachPackageChangeEvents({ modal, items, options, render })
  attachQtyEvents({ modal, items })
  attachRemoveEvents({ modal, items, render })
}

function attachCloseEvents(modal) {
  const closeButton = modal.querySelector('#closeProductModal')
  const cancelButton = modal.querySelector('#cancelProductModal')

  if (closeButton) closeButton.onclick = closeModal
  if (cancelButton) cancelButton.onclick = closeModal
}

function attachAddEvent({ items, options, render }) {
  const addButton = document.getElementById('addMiniRowBtn')

  if (!addButton) return

  addButton.onclick = () => {
    const nextOption = getFirstAvailableOption(items, options)

    if (!nextOption) {
      alert('Alle emballasjetyper er allerede lagt til')
      return
    }

    items.push(createProductModalItem(nextOption))

    render()
  }
}

function attachSaveEvent({ rowId, productName, items, options }) {
  const saveButton = document.getElementById('saveProductModal')

  if (!saveButton) return

  saveButton.onclick = () => {
    const cleanItems = readProductModalItems(items, options)

    updateOrderCell(rowId, productName, {
      items: cleanItems
    })

    closeModal()
    renderTable()
  }
}

function attachPackageChangeEvents({ modal, items, options, render }) {
  modal.querySelectorAll('[data-mini-package-index]').forEach((select) => {
    select.onchange = () => {
      const index = Number(select.dataset.miniPackageIndex)
      const option = options.find((item) => item.id === select.value)
      const updated = updateProductModalItemOption(items, index, option)

      if (updated) {
        render()
      }
    }
  })
}

function attachQtyEvents({ modal, items }) {
  modal.querySelectorAll('[data-mini-qty-index]').forEach((input) => {
    input.oninput = () => {
      const index = Number(input.dataset.miniQtyIndex)

      updateProductModalItemQty(items, index, input.value)
    }
  })
}

function attachRemoveEvents({ modal, items, render }) {
  modal.querySelectorAll('[data-remove-mini-row]').forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.removeMiniRow)
      const removed = removeProductModalItem(items, index)

      if (removed) {
        render()
      }
    }
  })
}
