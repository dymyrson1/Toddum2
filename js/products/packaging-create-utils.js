import { createPackagingId } from './packaging-id-utils.js'
import { formatPackagingLabel } from './packaging-format-utils.js'
import { parseWeightKg } from './packaging-normalize-utils.js'

export function createDefaultPackagingOption(packageName = 'kg') {
  const cleanPackageName = String(packageName || 'kg').trim() || 'kg'
  const weightKg = cleanPackageName.toLowerCase() === 'l' ? 1 : 1

  return {
    id: createPackagingId(cleanPackageName, weightKg),
    packageName: cleanPackageName,
    weightKg,
    label: cleanPackageName,
    isDefault: true
  }
}

export function getDefaultPackagingOptionForProduct(productName) {
  const normalizedProductName = String(productName || '')
    .trim()
    .toLowerCase()

  if (normalizedProductName === 'melk') {
    return createDefaultPackagingOption('l')
  }

  return createDefaultPackagingOption('kg')
}

export function createPackagingOption(packageName, weightKgInput) {
  const cleanPackageName = String(packageName || '').trim()
  const weightKg = parseWeightKg(weightKgInput)

  if (!cleanPackageName) return null
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null

  return {
    id: createPackagingId(cleanPackageName, weightKg),
    packageName: cleanPackageName,
    weightKg,
    label: formatPackagingLabel(cleanPackageName, weightKg),
    isDefault: false
  }
}
