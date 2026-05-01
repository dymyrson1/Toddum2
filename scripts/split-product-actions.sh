#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split product-actions.js into product CRUD and packaging modules"
echo ""

FILES=(
  "js/products/product-actions.js"
  "js/products/product-crud-actions.js"
  "js/products/product-packaging-actions.js"
  "js/products/product-packaging-selectors.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-product-actions.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/products

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/products/product-actions.js <<'JS'
export {
  addProductAction,
  moveProductAction,
  removeProductAction
} from './product-crud-actions.js'

export {
  getPackagingOptionsForProductFromState,
  getPackagingTypesForProductFromState
} from './product-packaging-selectors.js'

export {
  addProductPackagingOptionAction,
  removeProductPackagingOptionAction
} from './product-packaging-actions.js'
JS

cat > js/products/product-crud-actions.js <<'JS'
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

  state.products = normalizeProducts(state.products).filter(product => product !== name)

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
JS

cat > js/products/product-packaging-selectors.js <<'JS'
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
      .map(option => normalizePackagingOption(option))
      .filter(Boolean)
      .filter(option => !option.isDefault)
  ].sort((a, b) => {
    return Number(a.weightKg || 0) - Number(b.weightKg || 0)
  })
}

export function getPackagingTypesForProductFromState(state, productName) {
  return getPackagingOptionsForProductFromState(state, productName).map(
    option => option.label
  )
}
JS

cat > js/products/product-packaging-actions.js <<'JS'
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

  const exists = state.productPackagingTypes[cleanProduct].some(item => {
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

  const optionToRemove = getPackagingOptionsForProductFromState(
    state,
    cleanProduct
  ).find(option => {
    return option.id === cleanOptionId
  })

  if (optionToRemove?.isDefault) {
    alert('kg/l er standardmål og kan ikke slettes')
    return false
  }

  if (!state.productPackagingTypes[cleanProduct]) {
    return false
  }

  state.productPackagingTypes[cleanProduct] = state.productPackagingTypes[
    cleanProduct
  ]
    .map(option => parsePackagingOption(option))
    .filter(Boolean)
    .filter(option => option.id !== cleanOptionId)

  removePackagingOptionFromWeeks(state.weeks, cleanProduct, cleanOptionId)

  persistState()

  return true
}
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
