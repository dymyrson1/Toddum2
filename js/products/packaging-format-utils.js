import { formatNumber } from '../utils/number.js'

export function formatPackagingLabel(packageName, weightKg) {
  const cleanPackageName = String(packageName || '').trim()

  if (!cleanPackageName) return ''

  const normalized = cleanPackageName.toLowerCase()

  if (normalized === 'kg' || normalized === 'l') {
    return cleanPackageName
  }

  return `${cleanPackageName} - ${formatWeightLabel(weightKg)}`
}

export function formatWeightLabel(weightKg) {
  const value = Number(weightKg)

  if (!Number.isFinite(value) || value <= 0) {
    return '—'
  }

  if (value < 1) {
    return `${formatNumber(value * 1000)} g`
  }

  return `${formatNumber(value)} kg`
}

export function formatCellForLog(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return ''
  }

  return items
    .map((item) => {
      const qty = Number(item.qty) || 0
      const label = item.label || item.packageName || item.type || ''

      if (!qty || !label) return ''

      return `${formatNumber(qty)} ${label}`
    })
    .filter(Boolean)
    .join(', ')
}
