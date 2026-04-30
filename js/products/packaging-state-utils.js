import {
  createDefaultPackagingOption,
  normalizePackagingOptions
} from './packaging-utils.js'

import { normalizeProducts } from './product-utils.js'

export function normalizeProductPackagingTypesForProducts(products, packagingTypes) {
  const result = {}
  const normalizedProducts = normalizeProducts(products)

  normalizedProducts.forEach((product) => {
    result[product] = normalizePackagingOptions(
      packagingTypes?.[product] || [createDefaultPackagingOption()]
    )
  })

  return result
}

export function removePackagingOptionFromWeeks(weeks, productName, optionId) {
  Object.values(weeks || {}).forEach((week) => {
    if (!Array.isArray(week.rows)) return

    week.rows.forEach((row) => {
      const cell = row.cells?.[productName]

      if (!cell || !Array.isArray(cell.items)) return

      cell.items = cell.items.filter((item) => item.packageId !== optionId)

      if (cell.items.length === 0) {
        delete row.cells[productName]
      }
    })
  })
}
