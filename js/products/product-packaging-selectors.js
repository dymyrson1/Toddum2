import {
  getDefaultPackagingOptionForProduct,
  normalizePackagingOption
} from './packaging-utils.js'

export function getPackagingOptionsForProductFromState(state, productName) {
  const customOptions = state.productPackagingTypes?.[productName] || []
  const defaultOption = getDefaultPackagingOptionForProduct(productName)

  return [
    defaultOption,
    ...customOptions
      .map((option) => normalizePackagingOption(option))
      .filter(Boolean)
      .filter((option) => !option.isDefault)
  ].sort((a, b) => {
    return Number(a.weightKg || 0) - Number(b.weightKg || 0)
  })
}

export function getPackagingTypesForProductFromState(state, productName) {
  return getPackagingOptionsForProductFromState(state, productName).map(
    (option) => option.label
  )
}
