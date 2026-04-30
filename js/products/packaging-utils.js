import { DEFAULT_PACKAGING_OPTION } from '../app/constants.js'
import { normalizeLooseText, normalizeName, slugify } from '../utils/text.js'
import { formatNumber, toNumber, trimZeros } from '../utils/number.js'

export function normalizePackagingOptions(options) {
  const list = Array.isArray(options) ? options : []
  const result = [createDefaultPackagingOption()]

  list.forEach((entry) => {
    const option = parsePackagingOption(entry)

    if (!option) return
    if (option.isDefault) return

    const exists = result.some((item) => item.id === option.id)

    if (!exists) {
      result.push(option)
    }
  })

  return result.sort((a, b) => {
    return a.weightKg - b.weightKg || a.label.localeCompare(b.label)
  })
}

export function normalizePackagingOption(option) {
  if (!option) return null

  const packageName = String(
    option.packageName || option.name || option.label || ''
  ).trim()

  if (!packageName) return null

  const weightKg = Number(option.weightKg)
  const cleanWeightKg = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 1

  return {
    id: option.id || createPackagingOptionId(packageName, cleanWeightKg),
    packageName,
    label: option.label || packageName,
    weightKg: cleanWeightKg,
    isDefault: Boolean(option.isDefault)
  }
}

export function parsePackagingOption(value) {
  if (!value) return null

  if (typeof value === 'string') {
    return parsePackagingString(value)
  }

  if (typeof value === 'object') {
    const packageName = normalizeName(value.packageName || value.name || '')
    const weightKg = toNumber(value.weightKg ?? value.weight)

    if (!packageName) return null

    if (packageName.toLowerCase() === 'kg') {
      return createDefaultPackagingOption()
    }

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return null
    }

    return createPackagingOption(packageName, weightKg)
  }

  return null
}

export function createDefaultPackagingOption() {
  return {
    ...DEFAULT_PACKAGING_OPTION
  }
}

export function createPackagingOption(packageName, weightKgInput) {
  const cleanPackageName = normalizeName(packageName)
  const weightKg = toNumber(weightKgInput)

  if (!cleanPackageName) return null

  if (cleanPackageName.toLowerCase() === 'kg') {
    return createDefaultPackagingOption()
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return null
  }

  return {
    id: createPackagingOptionId(cleanPackageName, weightKg),
    packageName: cleanPackageName,
    weightKg,
    label: buildPackagingLabel(cleanPackageName, weightKg),
    isDefault: false
  }
}

export function createPackagingOptionId(packageName, weightKg = 1) {
  const cleanPackageName = normalizeName(packageName) || 'package'
  const cleanWeight = toNumber(weightKg)
  const safeWeight = Number.isFinite(cleanWeight) && cleanWeight > 0 ? cleanWeight : 1

  return `${slugify(cleanPackageName)}__${normalizeWeightKey(safeWeight)}`
}

export function getDefaultPackagingOptionForProduct(productName) {
  if (isLiterProduct(productName)) {
    return {
      id: 'default_l',
      packageName: 'l',
      label: 'l',
      weightKg: 1,
      isDefault: true
    }
  }

  return {
    id: 'default_kg',
    packageName: 'kg',
    label: 'kg',
    weightKg: 1,
    isDefault: true
  }
}

export function formatCellForLog(items) {
  return (items || [])
    .map((item) => formatItemForLog(item))
    .filter(Boolean)
    .join(', ')
}

function parsePackagingString(text) {
  const cleanText = normalizeName(text)

  if (!cleanText) return null

  if (cleanText.toLowerCase() === 'kg') {
    return createDefaultPackagingOption()
  }

  const gramMatch = cleanText.match(/^([\d.,]+)\s*g$/i)

  if (gramMatch) {
    const grams = Number(String(gramMatch[1]).replace(',', '.'))

    if (!Number.isFinite(grams) || grams <= 0) return null

    return createPackagingOption(cleanText, grams / 1000)
  }

  const kgOnlyMatch = cleanText.match(/^([\d.,]+)\s*kg$/i)

  if (kgOnlyMatch) {
    const kg = Number(String(kgOnlyMatch[1]).replace(',', '.'))

    if (!Number.isFinite(kg) || kg <= 0) return null

    return createPackagingOption(cleanText, kg)
  }

  const namedKgMatch = cleanText.match(/^(.*?)\s*-?\s*([\d.,]+)\s*kg$/i)

  if (namedKgMatch) {
    const packageName = normalizeName(namedKgMatch[1])
    const kg = Number(String(namedKgMatch[2]).replace(',', '.'))

    if (packageName && Number.isFinite(kg) && kg > 0) {
      return createPackagingOption(packageName, kg)
    }
  }

  return null
}

function isLiterProduct(productName) {
  return normalizeProductNameForUnit(productName) === 'melk'
}

function normalizeProductNameForUnit(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function buildPackagingLabel(packageName, weightKg) {
  if (packageName.toLowerCase() === 'kg') {
    return 'kg'
  }

  const weightLabel = formatWeight(weightKg)

  if (normalizeLooseText(packageName) === normalizeLooseText(weightLabel)) {
    return packageName
  }

  return `${packageName} - ${weightLabel}`
}

function formatWeight(weightKg) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return ''
  }

  const grams = Math.round(weightKg * 1000)

  if (grams < 1000) {
    return `${grams} g`
  }

  if (grams % 1000 === 0) {
    return `${grams / 1000} kg`
  }

  return `${trimZeros((grams / 1000).toFixed(2))} kg`
}

function normalizeWeightKey(weightKg) {
  return trimZeros(Number(weightKg).toFixed(3))
}

function formatItemForLog(item) {
  const qty = Number(item.qty) || 0
  const packageName = String(item.packageName || '').toLowerCase()
  const label = item.label || item.packageName || item.type || ''

  if (!qty || !label) return ''

  if (packageName === 'kg' || String(label).toLowerCase() === 'kg') {
    return `${formatNumber(qty)}kg`
  }

  if (packageName.includes('spann') || String(label).toLowerCase().includes('spann')) {
    return `${formatNumber(qty)} spann`
  }

  return `${formatNumber(qty)}x${label}`
}
