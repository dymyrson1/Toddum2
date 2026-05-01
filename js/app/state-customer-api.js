import {
  findCustomerByName,
  getCustomerNameValue
} from '../customers/customer-state-utils.js'

import {
  addCustomerAction,
  ensureCustomerExistsAction,
  moveCustomerAction,
  removeCustomerAction,
  updateCustomerAction
} from '../customers/customer-actions.js'

export function createStateCustomerApi({ state, createActionContext }) {
  function getCustomerName(customer) {
    return getCustomerNameValue(customer)
  }

  function getCustomerByName(name) {
    return findCustomerByName(state.customers, name)
  }

  function ensureCustomerExists(name) {
    return ensureCustomerExistsAction(createActionContext(), name)
  }

  function addCustomer(customerData) {
    return addCustomerAction(createActionContext(), customerData)
  }

  function updateCustomer(customerId, patch) {
    return updateCustomerAction(createActionContext(), customerId, patch)
  }

  function moveCustomer(customerId, direction) {
    return moveCustomerAction(createActionContext(), customerId, direction)
  }

  function removeCustomer(customerId) {
    return removeCustomerAction(createActionContext(), customerId)
  }

  return {
    getCustomerName,
    getCustomerByName,
    ensureCustomerExists,
    addCustomer,
    updateCustomer,
    moveCustomer,
    removeCustomer
  }
}
