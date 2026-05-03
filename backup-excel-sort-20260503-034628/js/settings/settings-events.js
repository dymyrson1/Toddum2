import {
  addCustomer,
  addProduct,
  addProductPackagingOption,
  moveCustomer,
  moveProduct,
  removeCustomer,
  removeProduct,
  removeProductPackagingOption,
  updateCustomer
} from '../state.js'
import { renderTab } from '../tabs/tabs-render.js'
import {
  getCustomerNameForConfirmation,
  renderCustomersList,
  renderPackagingList
} from './settings-render.js'
import { toggleSettingsCustomerSort } from './settings-customer-sort.js'

export function attachSettingsEvents(container) {
  container.onsubmit = (event) => {
    handleSettingsSubmit(event)
  }

  container.onchange = (event) => {
    handleSettingsChange(event)
  }

  container.onclick = (event) => {
    handleSettingsClick(event)
  }
}

function handleSettingsSubmit(event) {
  if (handleCustomerSubmit(event)) return
  if (handleProductSubmit(event)) return
  if (handlePackagingSubmit(event)) return
}

function handleSettingsChange(event) {
  if (handleCustomerFieldChange(event)) return
  if (handlePackagingProductChange(event)) return
}

function handleSettingsClick(event) {
  if (handleCustomerSortClick(event)) return
  if (handleCustomerMoveClick(event)) return
  if (handleCustomerRemoveClick(event)) return
  if (handleProductMoveClick(event)) return
  if (handleProductRemoveClick(event)) return
  if (handlePackagingRemoveClick(event)) return
}

function handleCustomerSortClick(event) {
  const button = event.target.closest('[data-settings-customer-sort]')
  if (!button) return false

  toggleSettingsCustomerSort(button.dataset.settingsCustomerSort)
  renderCustomersList()

  return true
}

function handleCustomerSubmit(event) {
  const form = event.target.closest('#customerForm')
  if (!form) return false

  event.preventDefault()

  const added = addCustomer({
    name: getInputValue('customerNameInput'),
    contactPerson: getInputValue('customerContactInput'),
    phone: getInputValue('customerPhoneInput'),
    address: getInputValue('customerAddressInput'),
    deliveryOrder: getInputValue('customerDeliveryOrderInput')
  })

  if (added) {
    renderTab()
  }

  return true
}

function handleProductSubmit(event) {
  const form = event.target.closest('#productForm')
  if (!form) return false

  event.preventDefault()

  const input = document.getElementById('productInput')
  const added = addProduct(input?.value || '')

  if (added) {
    renderTab()
  }

  return true
}

function handlePackagingSubmit(event) {
  const form = event.target.closest('#packagingForm')
  if (!form) return false

  event.preventDefault()

  const productSelect = document.getElementById('packagingProductSelect')
  const productName = productSelect?.value || ''
  const packagingNameInput = document.getElementById('packagingNameInput')
  const packagingWeightInput = document.getElementById('packagingWeightInput')

  const added = addProductPackagingOption(
    productName,
    packagingNameInput?.value || '',
    packagingWeightInput?.value || ''
  )

  if (added) {
    if (packagingNameInput) packagingNameInput.value = ''
    if (packagingWeightInput) packagingWeightInput.value = ''

    renderPackagingList(productName)
  }

  return true
}

function handleCustomerFieldChange(event) {
  const input = event.target.closest('[data-customer-field]')
  if (!input) return false

  updateCustomer(input.dataset.customerId, {
    [input.dataset.customerField]: input.value
  })

  renderCustomersList()

  return true
}

function handlePackagingProductChange(event) {
  const select = event.target.closest('#packagingProductSelect')
  if (!select) return false

  renderPackagingList(select.value)

  return true
}

function handleCustomerMoveClick(event) {
  const button = event.target.closest('[data-move-customer]')
  if (!button) return false

  const moved = moveCustomer(
    button.dataset.moveCustomer,
    button.dataset.moveDirection
  )

  if (moved) {
    renderCustomersList()
  }

  return true
}

function handleCustomerRemoveClick(event) {
  const button = event.target.closest('[data-remove-customer]')
  if (!button) return false

  const customerId = button.dataset.removeCustomer
  const customerName = getCustomerNameForConfirmation(customerId)

  const confirmed = confirm(`Vil du slette kunden "${customerName || ''}" fra listen?`)
  if (!confirmed) return true

  removeCustomer(customerId)
  renderTab()

  return true
}

function handleProductMoveClick(event) {
  const button = event.target.closest('[data-move-product]')
  if (!button) return false

  const moved = moveProduct(
    button.dataset.moveProduct,
    button.dataset.moveDirection
  )

  if (moved) {
    renderTab()
  }

  return true
}

function handleProductRemoveClick(event) {
  const button = event.target.closest('[data-remove-product]')
  if (!button) return false

  const productName = button.dataset.removeProduct

  const confirmed = confirm(
    `Vil du slette produktet "${productName}" og alle tilhørende data?`
  )

  if (!confirmed) return true

  removeProduct(productName)
  renderTab()

  return true
}

function handlePackagingRemoveClick(event) {
  const button = event.target.closest('[data-remove-product-packaging]')
  if (!button) return false

  const productSelect = document.getElementById('packagingProductSelect')
  const productName = productSelect?.value || ''
  const optionId = button.dataset.removeProductPackaging

  const confirmed = confirm(
    `Vil du slette denne emballasjen for produktet "${productName}"?`
  )

  if (!confirmed) return true

  const removed = removeProductPackagingOption(productName, optionId)

  if (removed) {
    renderPackagingList(productName)
  }

  return true
}

function getInputValue(id) {
  return document.getElementById(id)?.value || ''
}
