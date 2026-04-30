const STORAGE_KEY = 'orders-table-state-v1'

export function saveState(state) {
  try {
    const dataToSave = {
      currentDate: state.currentDate.toISOString(),
      customers: state.customers,
      products: state.products,
      weeks: state.weeks
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (error) {
    console.error('Local save failed:', error)
  }
}

export function loadState() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY)

    if (!rawData) return null

    return JSON.parse(rawData)
  } catch (error) {
    console.error('Local load failed:', error)
    return null
  }
}

export function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY)
}
