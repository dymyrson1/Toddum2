import { saveState, loadState } from './storage/local-storage.js'

export const state = {
  currentTab: 'orders',

  currentDate: new Date(),
  currentYear: null,
  currentWeek: null,

  selectedCellKey: null,

  customers: ['Client1', 'Client2'],
  products: ['Milk', 'Cheese'],

  weeks: {}
}

export function initState() {
  const savedState = loadState()

  if (savedState) {
    applySavedState(savedState)
  }

  updateCurrentYearWeek()
  ensureCurrentWeek()
}

export function persistState() {
  saveState(state)
}

export function getCurrentWeekId() {
  return `${state.currentYear}-W${String(state.currentWeek).padStart(2, '0')}`
}

export function ensureCurrentWeek() {
  const weekId = getCurrentWeekId()

  if (!state.weeks[weekId]) {
    state.weeks[weekId] = {
      cells: {}
    }

    persistState()
  }
}

export function getCurrentCells() {
  ensureCurrentWeek()
  return state.weeks[getCurrentWeekId()].cells
}

export function goToPreviousWeek() {
  state.currentDate.setDate(state.currentDate.getDate() - 7)
  updateCurrentYearWeek()
  ensureCurrentWeek()
  persistState()
}

export function goToNextWeek() {
  state.currentDate.setDate(state.currentDate.getDate() + 7)
  updateCurrentYearWeek()
  ensureCurrentWeek()
  persistState()
}

export function addCustomer(name) {
  const cleanName = normalizeName(name)
  if (!cleanName) return false

  if (state.customers.includes(cleanName)) {
    alert('Такий замовник вже існує')
    return false
  }

  state.customers.push(cleanName)
  persistState()

  return true
}

export function removeCustomer(name) {
  state.customers = state.customers.filter(customer => customer !== name)

  Object.values(state.weeks).forEach(week => {
    Object.keys(week.cells).forEach(key => {
      if (key.startsWith(`${name}__`)) {
        delete week.cells[key]
      }
    })
  })

  persistState()
}

export function addProduct(name) {
  const cleanName = normalizeName(name)
  if (!cleanName) return false

  if (state.products.includes(cleanName)) {
    alert('Такий продукт вже існує')
    return false
  }

  state.products.push(cleanName)
  persistState()

  return true
}

export function removeProduct(name) {
  state.products = state.products.filter(product => product !== name)

  Object.values(state.weeks).forEach(week => {
    Object.keys(week.cells).forEach(key => {
      if (key.endsWith(`__${name}`)) {
        delete week.cells[key]
      }
    })
  })

  persistState()
}

export function updateCell(key, value) {
  const cells = getCurrentCells()

  if (!value || !value.items || value.items.length === 0) {
    delete cells[key]
  } else {
    cells[key] = value
  }

  persistState()
}

export function deleteCell(key) {
  const cells = getCurrentCells()
  delete cells[key]
  persistState()
}

export function updateCheck(customer, checkType, checked) {
  const cells = getCurrentCells()
  const key = `${customer}__checks`

  if (!cells[key]) {
    cells[key] = {
      A: false,
      B: false
    }
  }

  cells[key][checkType] = checked
  persistState()
}

function applySavedState(savedState) {
  if (savedState.currentDate) {
    state.currentDate = new Date(savedState.currentDate)
  }

  if (Array.isArray(savedState.customers)) {
    state.customers = savedState.customers
  }

  if (Array.isArray(savedState.products)) {
    state.products = savedState.products
  }

  if (savedState.weeks && typeof savedState.weeks === 'object') {
    state.weeks = savedState.weeks
  }
}

function normalizeName(value) {
  return String(value || '').trim()
}

function updateCurrentYearWeek() {
  const result = getISOWeek(state.currentDate)

  state.currentYear = result.year
  state.currentWeek = result.week
}

function getISOWeek(dateInput) {
  const date = new Date(Date.UTC(
    dateInput.getFullYear(),
    dateInput.getMonth(),
    dateInput.getDate()
  ))

  const dayNumber = date.getUTCDay() || 7

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber)

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))

  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)

  return {
    year: date.getUTCFullYear(),
    week
  }
}