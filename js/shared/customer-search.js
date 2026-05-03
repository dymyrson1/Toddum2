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

export function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
