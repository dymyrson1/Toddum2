import { escapeHtml } from '../utils/html.js'
import { formatNumber } from '../utils/number.js'

export function formatKg(value) {
  return `${formatNumber(value)} kg`
}

export function formatPackageShort(packageRow) {
  const qty = formatNumber(packageRow.qty)
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || packageRow.packageName || '')

  if (packageName === 'kg' || label.toLowerCase() === 'kg') {
    return `${qty}kg`
  }

  if (packageName === 'l' || label.toLowerCase() === 'l') {
    return `${qty}l`
  }

  if (packageName.includes('spann') || label.toLowerCase().includes('spann')) {
    return `${qty} spann`
  }

  return `${qty}×${escapeHtml(label)}`
}

export function formatPackageLabel(packageRow) {
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = packageRow.label || packageRow.packageName

  if (packageName.includes('spann')) {
    return `spann - ${formatNumber(packageRow.weightKg)} kg`
  }

  return label
}

export function formatPackageQty(packageRow) {
  const qty = formatNumber(packageRow.qty)
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || '').toLowerCase()

  if (packageName === 'kg' || label === 'kg') {
    return `${qty} kg`
  }

  if (packageName === 'l' || label === 'l') {
    return `${qty} l`
  }

  if (packageName.includes('spann') || label.includes('spann')) {
    return `${qty} spann`
  }

  return `${qty} stk`
}

export function formatUnitWeight(packageRow) {
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || '').toLowerCase()

  if (packageName === 'l' || label === 'l') {
    return `${formatNumber(packageRow.weightKg)} l`
  }

  if (packageRow.weightKg < 1) {
    return `${formatNumber(packageRow.weightKg * 1000)} g`
  }

  return `${formatNumber(packageRow.weightKg)} kg`
}
