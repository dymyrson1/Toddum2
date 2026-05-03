import { getOrderCell, getPackagingOptionsForProduct } from '../state.js'
import { openModalContainer } from './modal-utils.js'
import {
  createProductModalItem,
  getFirstAvailableOption,
  normalizeProductModalItems
} from './product-modal-data.js'
import { attachProductModalEvents } from './product-modal-events.js'
import { renderProductModalHtml } from './product-modal-render.js'

export function openProductModal(rowId, productName) {
  const modal = openModalContainer()
  if (!modal) return

  const cell = getOrderCell(rowId, productName)
  const options = getPackagingOptionsForProduct(productName)

  const items = normalizeProductModalItems(cell.items || [], options)

  if (items.length === 0) {
    const defaultOption = getFirstAvailableOption(items, options)

    if (defaultOption) {
      items.push(createProductModalItem(defaultOption))
    }
  }

  renderProductModal(modal, rowId, productName, items, options)
}

function renderProductModal(modal, rowId, productName, items, options) {
  modal.innerHTML = renderProductModalHtml(productName, items, options)

  attachProductModalEvents({
    modal,
    rowId,
    productName,
    items,
    options,
    render: () => {
      renderProductModal(modal, rowId, productName, items, options)
    }
  })
}