import { normalizeName } from '../utils/text.js'
import { createDefaultPackagingOption } from './packaging-utils.js'

import {
  moveProductInList,
  normalizeProducts,
  productExists,
  removeProductFromWeeks
} from './product-utils.js'

export function addProductAction(context, name) {
  const { state, persistState } = context
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

  persistState()

  return true
}

export function removeProductAction(context, name) {
  const { state, persistState } = context

  state.products = normalizeProducts(state.products).filter((product) => product !== name)

  delete state.productPackagingTypes[name]

  removeProductFromWeeks(state.weeks, name)

  persistState()
}

export function moveProductAction(context, productName, direction) {
  const { state, persistState } = context

  const result = moveProductInList(state.products, productName, direction)

  if (!result.moved) return false

  state.products = result.products

  persistState()

  return true
}
