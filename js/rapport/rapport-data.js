export function buildRapportData({ rows = [], products = [], weekLabel = '' }) {
  const productMap = new Map()

  products.forEach((productName) => {
    productMap.set(productName, {
      productName,
      totalWeightKg: 0,
      packageRows: new Map()
    })
  })

  rows.forEach((row) => {
    products.forEach((productName) => {
      const cell = row.cells?.[productName]
      const items = Array.isArray(cell?.items) ? cell.items : []

      items.forEach((item) => {
        const qty = Number(item.qty) || 0
        const weightKg = Number(item.weightKg) || getFallbackWeight(item)
        const packageName = item.packageName || item.label || 'kg'
        const label = item.label || packageName

        if (qty <= 0) return

        const totalWeightKg = qty * weightKg
        const product = productMap.get(productName)
        const packageKey = `${packageName}__${weightKg}__${label}`

        if (!product.packageRows.has(packageKey)) {
          product.packageRows.set(packageKey, {
            productName,
            packageName,
            label,
            qty: 0,
            weightKg,
            totalWeightKg: 0
          })
        }

        const packageRow = product.packageRows.get(packageKey)

        packageRow.qty += qty
        packageRow.totalWeightKg += totalWeightKg
        product.totalWeightKg += totalWeightKg
      })
    })
  })

  const productsWithOrders = [...productMap.values()]
    .map((product) => ({
      ...product,
      packageRows: [...product.packageRows.values()].sort((a, b) => {
        return a.weightKg - b.weightKg
      })
    }))
    .filter((product) => product.packageRows.length > 0)

  const totalWeightKg = productsWithOrders.reduce((sum, product) => {
    return sum + product.totalWeightKg
  }, 0)

  const packageLineCount = productsWithOrders.reduce((sum, product) => {
    return sum + product.packageRows.length
  }, 0)

  const sortedByWeight = [...productsWithOrders].sort((a, b) => {
    return b.totalWeightKg - a.totalWeightKg
  })

  return {
    weekLabel,
    products: productsWithOrders,
    sortedByWeight,
    totalWeightKg,
    productCount: productsWithOrders.length,
    packageLineCount
  }
}

export function getFallbackWeight(item) {
  const label = String(item.label || item.packageName || '').toLowerCase()

  if (label.includes('10g')) return 0.01
  if (label.includes('125g')) return 0.125
  if (label.includes('250g')) return 0.25
  if (label.includes('500g')) return 0.5
  if (label.includes('3kg')) return 3
  if (label.includes('5kg')) return 5
  if (label.includes('6kg')) return 6
  if (label.includes('8kg')) return 8
  if (label === 'l') return 1
  if (label === 'kg') return 1

  return 1
}
