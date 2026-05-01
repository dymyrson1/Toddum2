export function hasOrderContent(row) {
  return Object.values(row.cells || {}).some((cell) => {
    return Array.isArray(cell.items) && cell.items.length > 0
  })
}

export function getDeliveryItems(row) {
  return Object.entries(row.cells || {})
    .map(([productName, cell]) => {
      const items = Array.isArray(cell.items) ? cell.items : []
      const itemText = items.map(formatDeliveryItem).filter(Boolean).join(', ')

      if (!itemText) return null

      return {
        productName,
        itemText
      }
    })
    .filter(Boolean)
}

export function formatDeliveryItem(item) {
  const qty = Number(item.qty) || 0
  const label = item.label || item.packageName || item.type || '—'
  const packageName = String(item.packageName || '').toLowerCase()
  const labelLower = String(label).toLowerCase()

  if (!qty) return ''

  if (packageName === 'kg' || labelLower === 'kg') {
    return `${formatNumber(qty)}kg`
  }

  if (
    packageName === 'l' ||
    packageName === 'liter' ||
    packageName === 'literer' ||
    labelLower === 'l' ||
    labelLower === 'liter' ||
    labelLower === 'literer'
  ) {
    return `${formatNumber(qty)}l`
  }

  if (packageName.includes('spann') || labelLower.includes('spann')) {
    return `${formatNumber(qty)} spann`
  }

  return `${formatNumber(qty)}x${label}`
}

function formatNumber(value) {
  return Number(value).toLocaleString('nb-NO', {
    maximumFractionDigits: 2
  })
}
