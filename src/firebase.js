import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            'AIzaSyA-vnieBjHtZD61OQ2liou8_UUDUIDAFRQ',
  authDomain:        'fittrack-2777e.firebaseapp.com',
  projectId:         'fittrack-2777e',
  storageBucket:     'fittrack-2777e.firebasestorage.app',
  messagingSenderId: '87013989382',
  appId:             '1:87013989382:web:05dfbe8f17e0ebefe63787',
  measurementId:     'G-8CTXLN4XQW',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
