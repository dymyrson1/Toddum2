export function createPackagingId(packageName, weightKg) {
  const namePart = normalizePackagingIdPart(packageName)
  const weightPart = normalizePackagingIdPart(String(weightKg || 0))

  if (!namePart) return ''

  if (namePart === 'kg') return 'default_kg'
  if (namePart === 'l') return 'default_l'

  return `${namePart}__${weightPart}`
}

export function normalizePackagingIdPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(',', '.')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '')
}
