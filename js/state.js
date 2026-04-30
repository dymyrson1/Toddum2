import { loadFirebaseState, saveFirebaseState } from './firebase.js'
import { setSyncStatus } from './sync/sync-status.js'

export const state = {
  currentTab: 'orders',

  currentDate: new Date(),
  currentYear: null,
  currentWeek: null,

  selectedCellKey: null,

  customers: ['Client1', 'Client2'],
  products: ['Milk', 'Cheese'],
  packagingTypes: ['box', 'bag', 'kg', 'pcs'],

  weeks: {}
}

let saveTimer = null

export async function initState() {
  try {
    setSyncStatus('connecting', 'Firebase: connecting...')

    const firebaseState = await loadFirebaseState()

    if (firebaseState) {
      applySavedState(firebaseState)
      setSyncStatus('saved', 'Firebase: loaded')
    } else {
      setSyncStatus('saved', 'Firebase: connected, no data')
    }
  } catch (error) {
    console.error('Firebase load failed:', error)
    setSyncStatus('error', 'Firebase: load error')
  }

  updateCurrentYearWeek()
  ensureCurrentWeek()

  persistState()
}

export function persistState() {
  clearTimeout(saveTimer)

  setSyncStatus('saving', 'Firebase: saving...')

  saveTimer = setTimeout(() => {
    saveFirebaseState(prepareStateForSaving())
      .then(() => {
        console.log('Saved to Firebase')
        setSyncStatus('saved', 'Firebase: saved')
      })
      .catch(error => {
        console.error('Firebase save failed:', error)
        setSyncStatus('error', 'Firebase: save error')
      })
  }, 400)
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

export function addPackagingType(name) {
  const cleanName = normalizeName(name)
  if (!cleanName) return false

  if (state.packagingTypes.includes(cleanName)) {
    alert('Такий тип упаковки вже існує')
    return false
  }

  state.packagingTypes.push(cleanName)
  persistState()

  return true
}

export function removePackagingType(name) {
  state.packagingTypes = state.packagingTypes.filter(type => type !== name)

  Object.values(state.weeks).forEach(week => {
    Object.values(week.cells).forEach(cell => {
      if (!cell.items) return

      cell.items = cell.items.filter(item => item.type !== name)
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

function prepareStateForSaving() {
  return {
    currentDate: state.currentDate.toISOString(),
    customers: state.customers,
    products: state.products,
    packagingTypes: state.packagingTypes,
    weeks: state.weeks
  }
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

  if (Array.isArray(savedState.packagingTypes)) {
    state.packagingTypes = savedState.packagingTypes
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