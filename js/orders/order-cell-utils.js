import { normalizeName, normalizeLooseText } from '../utils/text.js'
import { parsePackagingOption } from '../products/packaging-utils.js'

export function normalizeOrderCells(cells, getPackagingOptionsForProduct) {
  const result = {}

  Object.entries(cells || {}).forEach(([productName, cell]) => {
    const options = getPackagingOptionsForProduct(productName)
    const items = normalizeOrderCellItems(cell?.items || [], options)

    if (items.length > 0) {
      result[productName] = {
        items
      }
    }
  })

  return result
}

export function normalizeOrderCellItems(items, options = []) {
  const used = new Set()

  return (items || [])
    .map((item) => normalizeOrderCellItem(item, options))
    .filter(Boolean)
    .filter((item) => {
      if (used.has(item.packageId)) return false

      used.add(item.packageId)

      return true
    })
    .sort((a, b) => {
      return a.weightKg - b.weightKg || a.label.localeCompare(b.label)
    })
}

export function normalizeOrderCellItem(item, options = []) {
  const qty = Number(item?.qty)

  if (!Number.isFinite(qty) || qty <= 0) {
    return null
  }

  const rawId = normalizeName(item?.packageId)
  const rawType = normalizeName(item?.type || item?.packageName || item?.label)

  let option = null

  if (rawId) {
    option = options.find((entry) => entry.id === rawId) || null
  }

  if (!option && rawType) {
    const normalizedRawType = normalizeLooseText(rawType)

    option =
      options.find((entry) => {
        return (
          normalizeLooseText(entry.id) === normalizedRawType ||
          normalizeLooseText(entry.packageName) === normalizedRawType ||
          normalizeLooseText(entry.label) === normalizedRawType
        )
      }) || null
  }

  if (!option && rawType) {
    option = parsePackagingOption(rawType)
  }

  if (!option) {
    return null
  }

  return {
    packageId: option.id,
    packageName: option.packageName,
    weightKg: option.weightKg,
    label: option.label,
    qty
  }
}
