import { normalizeName } from '../utils/text.js'

import {
  createDefaultPackagingOption,
  createPackagingOption,
  getDefaultPackagingOptionForProduct,
  normalizePackagingOption,
  normalizePackagingOptions,
  parsePackagingOption
} from './packaging-utils.js'

import {
  moveProductInList,
  normalizeProducts,
  productExists,
  removeProductFromWeeks
} from './product-utils.js'

import { removePackagingOptionFromWeeks } from './packaging-state-utils.js'

export function addProductAction(context, name) {
  const { state, addLog, persistState } = context
  const cleanName = normalizeName(name)

  if (!cleanName) return false

  if (productExists(state.products, cleanName)) {
    alert('Dette produktet finnes allerede')
    return false
  }

  state.products = normalizeProducts([...state.products, cleanName])

  if (!state.productPackagingTypes[cleanName]) {
    state.productPackagingTypes[cleanName] = [createDefaultPackagingOption()]
  }

  addLog('add_product', {
    actionLabel: 'La til produkt',
    productName: cleanName,
    newValue: cleanName
  })

  persistState()

  return true
}

export function removeProductAction(context, name) {
  const { state, addLog, persistState } = context

  state.products = normalizeProducts(state.products).filter((product) => product !== name)

  delete state.productPackagingTypes[name]

  removeProductFromWeeks(state.weeks, name)

  addLog('remove_product', {
    actionLabel: 'Fjernet produkt',
    productName: name,
    oldValue: name
  })

  persistState()
}

export function moveProductAction(context, productName, direction) {
  const { state, addLog, persistState } = context

  const oldValue = normalizeProducts(state.products).join(', ')
  const result = moveProductInList(state.products, productName, direction)

  if (!result.moved) return false

  state.products = result.products

  const newValue = state.products.join(', ')

  addLog('move_product', {
    actionLabel: 'Endret produktrekkefølge',
    productName,
    oldValue,
    newValue
  })

  persistState()

  return true
}

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

export function addProductPackagingOptionAction(
  context,
  productName,
  packageName,
  weightKgInput
) {
  const { state, addLog, persistState } = context

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

  addLog('add_packaging', {
    actionLabel: 'La til emballasje',
    productName: cleanProduct,
    newValue: option.label
  })

  persistState()

  return true
}

export function removeProductPackagingOptionAction(context, productName, optionId) {
  const { state, addLog, persistState } = context

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

  addLog('remove_packaging', {
    actionLabel: 'Fjernet emballasje',
    productName: cleanProduct,
    oldValue: optionToRemove?.label || cleanOptionId
  })

  persistState()

  return true
}
