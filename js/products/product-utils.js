import { normalizeName } from '../utils/text.js'

export function normalizeProducts(products) {
  if (!Array.isArray(products)) return []

  return products.map(product => normalizeName(product)).filter(Boolean)
}

export function productExists(products, productName) {
  const cleanName = normalizeName(productName)

  return normalizeProducts(products).includes(cleanName)
}

export function moveProductInList(products, productName, direction) {
  const list = normalizeProducts(products)
  const currentIndex = list.indexOf(productName)

  if (currentIndex === -1) {
    return {
      moved: false,
      products: list,
      currentIndex: -1,
      targetIndex: -1
    }
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (targetIndex < 0 || targetIndex >= list.length) {
    return {
      moved: false,
      products: list,
      currentIndex,
      targetIndex
    }
  }

  const nextProducts = [...list]
  const currentProduct = nextProducts[currentIndex]

  nextProducts[currentIndex] = nextProducts[targetIndex]
  nextProducts[targetIndex] = currentProduct

  return {
    moved: true,
    products: nextProducts,
    currentIndex,
    targetIndex
  }
}

export function removeProductFromWeeks(weeks, productName) {
  Object.values(weeks || {}).forEach(week => {
    if (!Array.isArray(week.rows)) return

    week.rows.forEach(row => {
      if (row.cells) {
        delete row.cells[productName]
      }
    })
  })
}