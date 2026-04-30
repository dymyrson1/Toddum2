export function normalizeName(value) {
  return String(value || '').trim()
}

export function normalizeLooseText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('-', '')
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яіїєåøæ_-]/gi, '')
}
