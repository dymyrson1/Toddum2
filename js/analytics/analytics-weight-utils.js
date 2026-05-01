export function hasOrderContent(row, products = []) {
  return products.some((productName) => {
    const cell = row.cells?.[productName]

    return Array.isArray(cell?.items) && cell.items.length > 0
  })
}

export function getRowWeight(row, products = []) {
  let total = 0

  products.forEach((productName) => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    items.forEach((item) => {
      const qty = Number(item.qty) || 0
      const weightKg = Number(item.weightKg) || getFallbackWeight(item)

      total += qty * weightKg
    })
  })

  return total
}

export function getRowLineCount(row, products = []) {
  let count = 0

  products.forEach((productName) => {
    const cell = row.cells?.[productName]
    const items = Array.isArray(cell?.items) ? cell.items : []

    count += items.filter((item) => Number(item.qty) > 0).length
  })

  return count
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
