export function toNumber(value) {
  if (typeof value === 'number') return value

  return Number(String(value || '').replace(',', '.'))
}

export function trimZeros(value) {
  return String(value).replace(/\.?0+$/, '')
}

export function formatNumber(value, options = {}) {
  const minimumFractionDigits = options.minimumFractionDigits ?? 0
  const maximumFractionDigits = options.maximumFractionDigits ?? 2

  return Number(value || 0).toLocaleString('nb-NO', {
    minimumFractionDigits,
    maximumFractionDigits
  })
}

export function formatKg(value) {
  return `${formatNumber(value)} kg`
}