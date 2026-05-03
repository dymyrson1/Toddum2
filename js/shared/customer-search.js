const customerSearch = {
  orders: '',
  rapport: ''
}

export function getCustomerSearch(scope) {
  return customerSearch[scope] || ''
}

export function setCustomerSearch(scope, value) {
  customerSearch[scope] = String(value || '')
}

export function clearCustomerSearch(scope) {
  customerSearch[scope] = ''
}

export function filterRowsByCustomerSearch(rows, scope) {
  if (!Array.isArray(rows)) return []

  const query = normalizeSearchValue(getCustomerSearch(scope))
  if (!query) return rows

  return rows.filter((row) => {
    return normalizeSearchValue(row.customerName).includes(query)
  })
}

export function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
