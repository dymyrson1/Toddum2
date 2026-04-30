export function toNumber(value) {
  if (typeof value === 'number') return value

  return Number(String(value || '').replace(',', '.'))
}

export function trimZeros(value) {
  return String(value).replace(/\.?0+$/, '')
}

export function formatNumber(value) {
  return Number(value).toLocaleString('nb-NO', {
    maximumFractionDigits: 2
  })
}