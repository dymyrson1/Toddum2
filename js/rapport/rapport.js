import { getCurrentRows, getCurrentWeekId } from '../state.js'

export function getRapportData() {
  const rows = getCurrentRows()

  const productsMap = new Map()

  let totalWeight = 0
  let totalOrderLines = 0

  rows.forEach(row => {
    Object.entries(row.cells || {}).forEach(([productName, cell]) => {
      if (!cell.items || cell.items.length === 0) return

      if (!productsMap.has(productName)) {
        productsMap.set(productName, {
          productName,
          packages: new Map(),
          totalWeight: 0
        })
      }

      const productEntry = productsMap.get(productName)

      cell.items.forEach(item => {
        const qty = Number(item.qty) || 0
        const weightKg = Number(item.weightKg) || 0
        const lineWeight = qty * weightKg

        if (qty <= 0) return

        const packageId = item.packageId || item.label || item.packageName || 'unknown'
        const packageName = item.packageName || item.label || item.type || 'Ukjent'
        const label = item.label || packageName

        if (!productEntry.packages.has(packageId)) {
          productEntry.packages.set(packageId, {
            packageId,
            packageName,
            label,
            weightKg,
            qty: 0,
            totalWeight: 0
          })
        }

        const packageEntry = productEntry.packages.get(packageId)

        packageEntry.qty += qty
        packageEntry.totalWeight += lineWeight

        productEntry.totalWeight += lineWeight
        totalWeight += lineWeight
        totalOrderLines++
      })
    })
  })

  const products = Array.from(productsMap.values())
    .map(product => ({
      ...product,
      packages: Array.from(product.packages.values())
        .sort((a, b) => a.weightKg - b.weightKg || a.label.localeCompare(b.label))
    }))
    .sort((a, b) => a.productName.localeCompare(b.productName))

  return {
    weekId: getCurrentWeekId(),
    totalOrderLines,
    totalWeight,
    products
  }
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('nb-NO', {
    maximumFractionDigits: 2
  })
}

export function formatWeightKg(value) {
  const number = Number(value) || 0
  return `${formatNumber(number)} kg`
}

export function formatPackageLine(packageEntry) {
  const qty = formatNumber(packageEntry.qty)
  const weight = formatWeightForPackage(packageEntry.weightKg)

  if (packageEntry.packageName.toLowerCase() === 'kg') {
    return `${qty} kg`
  }

  return `${qty} × ${packageEntry.packageName} à ${weight}`
}

function formatWeightForPackage(weightKg) {
  const value = Number(weightKg) || 0

  if (value <= 0) return '—'

  const grams = Math.round(value * 1000)

  if (grams < 1000) {
    return `${grams} g`
  }

  if (grams % 1000 === 0) {
    return `${grams / 1000} kg`
  }

  return `${formatNumber(value)} kg`
}