import {
  addProductAction,
  addProductPackagingOptionAction,
  getPackagingOptionsForProductFromState,
  getPackagingTypesForProductFromState,
  moveProductAction,
  removeProductAction,
  removeProductPackagingOptionAction
} from '../products/product-actions.js'

export function createStateProductApi({ state, createActionContext }) {
  function addProduct(name) {
    return addProductAction(createActionContext(), name)
  }

  function removeProduct(name) {
    return removeProductAction(createActionContext(), name)
  }

  function moveProduct(productName, direction) {
    return moveProductAction(createActionContext(), productName, direction)
  }

  function getPackagingOptionsForProduct(productName) {
    return getPackagingOptionsForProductFromState(state, productName)
  }

  function getPackagingTypesForProduct(productName) {
    return getPackagingTypesForProductFromState(state, productName)
  }

  function addProductPackagingOption(productName, packageName, weightKgInput) {
    return addProductPackagingOptionAction(
      createActionContext(),
      productName,
      packageName,
      weightKgInput
    )
  }

  function removeProductPackagingOption(productName, optionId) {
    return removeProductPackagingOptionAction(
      createActionContext(),
      productName,
      optionId
    )
  }

  return {
    addProduct,
    removeProduct,
    moveProduct,
    getPackagingOptionsForProduct,
    getPackagingTypesForProduct,
    addProductPackagingOption,
    removeProductPackagingOption
  }
}
