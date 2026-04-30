import { saveFirebaseState, loadFirebaseState } from './firebase.js'

const EMPTY_PROJECT_STATE = {
  currentDate: new Date().toISOString(),

  customers: [],
  products: [],
  packagingTypes: [],

  weeks: {}
}

export async function seedEmptyFirebaseState() {
  const confirmed = confirm(
    'УВАГА: Це очистить поточні дані Firebase і створить порожню структуру. Продовжити?'
  )

  if (!confirmed) {
    console.log('Firebase seed cancelled')
    return
  }

  try {
    console.log('Seeding Firebase with empty project structure...')

    await saveFirebaseState(EMPTY_PROJECT_STATE)

    console.log('Firebase seed completed:', EMPTY_PROJECT_STATE)

    alert('Firebase очищено і створено правильну порожню структуру. Онови сторінку.')
  } catch (error) {
    console.error('Firebase seed failed:', error)
    alert('Помилка під час seed Firebase. Дивись Console.')
  }
}

export async function checkFirebaseState() {
  try {
    const data = await loadFirebaseState()

    console.log('Current Firebase state:', data)

    return data
  } catch (error) {
    console.error('Firebase check failed:', error)
    return null
  }
}