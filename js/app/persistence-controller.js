import { saveFirebaseState } from '../firebase.js'
import { setSyncStatus } from '../sync/sync-status.js'
import { prepareRuntimeStateForSaving } from './state-persistence-utils.js'

export function createPersistenceController(state, options = {}) {
  const debounceMs = options.debounceMs ?? 400

  let saveTimer = null

  function persistState() {
    clearTimeout(saveTimer)

    setSyncStatus('saving', 'Firebase: saving...')

    saveTimer = setTimeout(() => {
      saveFirebaseState(prepareRuntimeStateForSaving(state))
        .then(() => {
          console.log('Saved to Firebase')
          setSyncStatus('saved', 'Firebase: saved')
        })
        .catch(error => {
          console.error('Firebase save failed:', error)
          setSyncStatus('error', 'Firebase: save error')
        })
    }, debounceMs)
  }

  return {
    persistState
  }
}