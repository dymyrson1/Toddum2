import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js'
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js'

const firebaseConfig = {
  apiKey: 'ТВІЙ_API_KEY',
  authDomain: 'toddum2-79852.firebaseapp.com',
  projectId: 'toddum2-79852',
  storageBucket: 'toddum2-79852.firebasestorage.app',
  messagingSenderId: '494143603797',
  appId: '1:494143603797:web:63b3ea0046f4acdcde40dc'
}

const app = initializeApp(firebaseConfig)

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
})

const APP_DOC_PATH = ['apps', 'ordersTable']

export async function loadFirebaseState() {
  const ref = doc(db, ...APP_DOC_PATH)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data()
}

export async function saveFirebaseState(data) {
  const ref = doc(db, ...APP_DOC_PATH)

  await setDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString()
  })
}
