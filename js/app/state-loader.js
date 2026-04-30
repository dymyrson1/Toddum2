import { loadFirebaseState } from '../firebase.js'
import { setSyncStatus } from '../sync/sync-status.js'
import { applySavedStateToRuntimeState } from './state-persistence-utils.js'

export async function loadRuntimeStateFromFirebase(state) {
  try {
    setSyncStatus('connecting', 'Firebase: connecting...')

    const firebaseState = await loadFirebaseState()

    if (firebaseState) {
      applySavedStateToRuntimeState(state, firebaseState)
      setSyncStatus('saved', 'Firebase: loaded')

      return {
        loaded: true,
        hasData: true
      }
    }

    setSyncStatus('saved', 'Firebase: connected, no data')

    return {
      loaded: true,
      hasData: false
    }
  } catch (error) {
    console.error('Firebase load failed:', error)
    setSyncStatus('error', 'Firebase: load error')

    return {
      loaded: false,
      hasData: false,
      error
    }
  }
}