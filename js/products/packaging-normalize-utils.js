import { createPackagingId } from './packaging-id-utils.js'
import { formatPackagingLabel } from './packaging-format-utils.js'

export function parsePackagingOption(value) {
  if (!value) return null

  if (typeof value === 'string') {
    return parsePackagingString(value)
  }

  if (typeof value === 'object') {
    return normalizePackagingOption(value)
  }

  return null
}

export function normalizePackagingOption(option) {
  if (!option) return null

  if (typeof option === 'string') {
    return parsePackagingString(option)
  }

  const packageName = String(
    option.packageName || option.name || option.label || ''
  ).trim()
  const weightKg = parseWeightKg(option.weightKg ?? option.weight ?? option.kg ?? 1)
  const isDefault = Boolean(option.isDefault)

  if (!packageName) return null
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null

  return {
    id: option.id || createPackagingId(packageName, weightKg),
    packageName,
    weightKg,
    label: option.label || formatPackagingLabel(packageName, weightKg),
    isDefault
  }
}

export function normalizePackagingOptions(options = []) {
  const normalized = options.map((option) => parsePackagingOption(option)).filter(Boolean)

  const result = []
  const usedIds = new Set()
  const defaultOption = normalized.find((option) => option.isDefault)

  if (defaultOption) {
    result.push({
      ...defaultOption,
      isDefault: true
    })
    usedIds.add(defaultOption.id)
  }

  normalized.forEach((option) => {
    if (usedIds.has(option.id)) return

    result.push({
      ...option,
      isDefault: Boolean(option.isDefault)
    })

    usedIds.add(option.id)
  })

  return result.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1

    return Number(a.weightKg || 0) - Number(b.weightKg || 0)
  })
}

export function parseWeightKg(value) {
  if (typeof value === 'number') return value

  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(',', '.')

  if (!normalized) return 0

  const number = Number(normalized.replace(/[^0-9.]/g, ''))

  if (!Number.isFinite(number)) return 0

  if (normalized.includes('g') && !normalized.includes('kg')) {
    return number / 1000
  }

  return number
}

function parsePackagingString(value) {
  const cleanValue = String(value || '').trim()

  if (!cleanValue) return null

  const lower = cleanValue.toLowerCase()
  const weightKg = parseWeightKg(cleanValue) || 1
  const isDefault = lower === 'kg' || lower === 'l'

  return {
    id: createPackagingId(cleanValue, weightKg),
    packageName: cleanValue,
    weightKg,
    label: isDefault ? cleanValue : formatPackagingLabel(cleanValue, weightKg),
    isDefault
  }
}
