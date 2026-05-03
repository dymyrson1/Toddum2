export function normalizeProductModalItems(items = [], options = []) {
  return items
    .map((item) => {
      const option = options.find((entry) => entry.id === item.packageId)
      if (!option) return null

      return {
        packageId: option.id,
        packageName: option.packageName,
        weightKg: option.weightKg,
        label: option.label,
        qty: item.qty || ''
      }
    })
    .filter(Boolean)
}

export function readProductModalItems(items = [], options = []) {
  const used = new Set()

  return items
    .map((item) => {
      const option = options.find((entry) => entry.id === item.packageId)
      const qty = Number(item.qty)

      if (!option) return null
      if (!Number.isFinite(qty) || qty <= 0) return null
      if (used.has(option.id)) return null

      used.add(option.id)

      return {
        packageId: option.id,
        packageName: option.packageName,
        weightKg: option.weightKg,
        label: option.label,
        qty
      }
    })
    .filter(Boolean)
}

export function getFirstAvailableOption(items = [], options = []) {
  const usedPackageIds = new Set(items.map((item) => item.packageId))

  return (
    options
      .filter((option) => !usedPackageIds.has(option.id))
      .sort((a, b) => Number(a.weightKg || 0) - Number(b.weightKg || 0))[0] || null
  )
}

export function createProductModalItem(option) {
  return {
    packageId: option.id,
    packageName: option.packageName,
    weightKg: option.weightKg,
    label: option.label,
    qty: ''
  }
}

export function updateProductModalItemOption(items, index, option) {
  if (!option || !items[index]) return false

  items[index] = {
    ...items[index],
    packageId: option.id,
    packageName: option.packageName,
    weightKg: option.weightKg,
    label: option.label
  }

  return true
}

export function updateProductModalItemQty(items, index, qty) {
  if (!items[index]) return false

  items[index].qty = qty
  return true
}

export function removeProductModalItem(items, index) {
  if (!items[index]) return false

  items.splice(index, 1)
  return true
}