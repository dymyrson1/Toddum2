import { normalizeName } from '../utils/text.js'

import {
  createDefaultPackagingOption,
  createPackagingOption,
  normalizePackagingOptions,
  parsePackagingOption
} from './packaging-utils.js'

import { removePackagingOptionFromWeeks } from './packaging-state-utils.js'
import { productExists } from './product-utils.js'
import { getPackagingOptionsForProductFromState } from './product-packaging-selectors.js'

export function addProductPackagingOptionAction(
  context,
  productName,
  packageName,
  weightKgInput
) {
  const { state, persistState } = context

  const cleanProduct = normalizeName(productName)
  const cleanPackageName = normalizeName(packageName)

  if (!cleanProduct || !cleanPackageName) return false

  if (!productExists(state.products, cleanProduct)) {
    alert('Legg til produktet først')
    return false
  }

  const option = createPackagingOption(cleanPackageName, weightKgInput)

  if (!option) {
    alert('Skriv inn gyldig emballasjenavn og vekt')
    return false
  }

  if (
    !Array.isArray(state.productPackagingTypes[cleanProduct]) ||
    state.productPackagingTypes[cleanProduct].length === 0
  ) {
    state.productPackagingTypes[cleanProduct] = [createDefaultPackagingOption()]
  }

  const exists = state.productPackagingTypes[cleanProduct].some((item) => {
    return parsePackagingOption(item)?.id === option.id
  })

  if (exists) {
    alert('Denne emballasjen finnes allerede for dette produktet')
    return false
  }

  state.productPackagingTypes[cleanProduct].push(option)
  state.productPackagingTypes[cleanProduct] = normalizePackagingOptions(
    state.productPackagingTypes[cleanProduct]
  )

  persistState()

  return true
}

export function removeProductPackagingOptionAction(context, productName, optionId) {
  const { state, persistState } = context

  const cleanProduct = normalizeName(productName)
  const cleanOptionId = normalizeName(optionId)

  if (!cleanProduct || !cleanOptionId) return false

  const optionToRemove = getPackagingOptionsForProductFromState(state, cleanProduct).find(
    (option) => {
      return option.id === cleanOptionId
    }
  )

  if (optionToRemove?.isDefault) {
    alert('kg/l er standardmål og kan ikke slettes')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    return false
  }

  state.productPackagingTypes[cleanProduct] = state.productPackagingTypes[cleanProduct]
    .map((option) => parsePackagingOption(option))
    .filter(Boolean)
    .filter((option) => option.id !== cleanOptionId)

  removePackagingOptionFromWeeks(state.weeks, cleanProduct, cleanOptionId)

  persistState()

  return true
}
